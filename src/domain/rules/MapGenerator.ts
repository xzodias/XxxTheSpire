import type { MapNode } from '../entities/MapNode'
import { NodeType } from '../enums/NodeType'
import type { Seed } from '../value-objects/Seed'
import type { NodeId } from '../../shared/types'

/**
 * 文字列シードを32bit符号なし整数にハッシュする（djb2変形）
 */
function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return h >>> 0
}

/**
 * Mulberry32 疑似乱数生成器ファクトリ
 * 同一シードから同一乱数列を生成する（決定論的）
 */
function createPrng(seed: string): () => number {
  let s = hashSeed(seed)
  return (): number => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * min 以上 max 以下（両端を含む）の整数乱数を返す。
 */
function nextInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/**
 * フロアと進行度に応じてノード種別を選択する。
 *
 * @param floor - 現在のフロアインデックス（0 = 最初のフロア）
 * @param totalFloors - 全フロア数（ボスフロアを含む）
 * @param rng - 疑似乱数生成器
 */
function selectNodeType(floor: number, totalFloors: number, rng: () => number): NodeType {
  // 最初のフロアはCombatのみ
  if (floor === 0) return NodeType.Combat

  // ボス直前フロアはRest/Shop重視
  if (floor >= totalFloors - 2) {
    return rng() < 0.6 ? NodeType.Rest : NodeType.Shop
  }

  const progress = floor / totalFloors
  const roll = rng()

  if (progress < 0.4) {
    // 序盤: Combat 60% / Event 20% / Elite 10% / Shop 10%
    if (roll < 0.6) return NodeType.Combat
    if (roll < 0.8) return NodeType.Event
    if (roll < 0.9) return NodeType.Elite
    return NodeType.Shop
  } else if (progress < 0.7) {
    // 中盤: Combat 45% / Event 20% / Elite 15% / Shop 10% / Rest 10%
    if (roll < 0.45) return NodeType.Combat
    if (roll < 0.65) return NodeType.Event
    if (roll < 0.8) return NodeType.Elite
    if (roll < 0.9) return NodeType.Shop
    return NodeType.Rest
  } else {
    // 終盤: Combat 35% / Elite 20% / Rest 15% / Event 15% / Shop 15%
    if (roll < 0.35) return NodeType.Combat
    if (roll < 0.55) return NodeType.Elite
    if (roll < 0.7) return NodeType.Rest
    if (roll < 0.85) return NodeType.Event
    return NodeType.Shop
  }
}

/**
 * 接続 (nodeCol → targetCol) が既存の接続群と交差するか判定する。
 * nodeCol1 < nodeCol2 の場合、nodeCol1 の接続先 t1 は nodeCol2 の接続先 t2 以下でなければならない。
 *
 * @remarks 計算量は O(currentCount * nextCount)。ゲーム想定の幅（3〜7）では問題なし。
 */
function wouldCross(conns: number[][], nodeCol: number, targetCol: number): boolean {
  for (let col2 = 0; col2 < conns.length; col2++) {
    if (col2 === nodeCol) continue
    for (const t2 of conns[col2]!) {
      if ((nodeCol < col2 && targetCol > t2) || (nodeCol > col2 && targetCol < t2)) return true
    }
  }
  return false
}

/**
 * Slay the Spire風マップグラフを生成する純粋関数。
 *
 * @param seed - 乱数シード（同じシードは同じマップを生成）
 * @param floors - フロア総数（ボスフロアを含む）。最小2。
 * @param width - 1フロアあたりの最大ノード数（ボスフロアを除く）
 * @returns floors 要素の MapNode[][] 配列。
 *          最初のフロアは Combat のみ、最後のフロアは単一の Boss ノード。
 *
 * @remarks
 * **参照可能な層**: domain/entities, domain/enums, domain/value-objects, shared/types のみ
 * application / infrastructure / presentation には依存しない。
 */
export function generateMap(seed: Seed, floors: number, width: number): MapNode[][] {
  const rng = createPrng(seed.value)
  let nodeCounter = 0
  const makeId = (): NodeId => `node-${nodeCounter++}` as NodeId

  // ── Step 1: 全ノードを生成（接続情報なし）──────────────────
  const allFloors: MapNode[][] = []
  for (let f = 0; f < floors; f++) {
    const isBoss = f === floors - 1
    const nodeCount = isBoss ? 1 : nextInt(rng, 1, width)
    const floorNodes: MapNode[] = []
    for (let n = 0; n < nodeCount; n++) {
      const type = isBoss ? NodeType.Boss : selectNodeType(f, floors, rng)
      floorNodes.push({ id: makeId(), type, floor: f, connections: [], visited: false })
    }
    allFloors.push(floorNodes)
  }

  // ── Step 2: 接続を生成（交差なし制約） ────────────────────
  for (let f = 0; f < floors - 1; f++) {
    const currentFloor = allFloors[f]!
    const nextFloor = allFloors[f + 1]!
    const currentCount = currentFloor.length
    const nextCount = nextFloor.length

    // conns[c] = 次フロアのノードインデックスのリスト
    const conns: number[][] = Array.from({ length: currentCount }, () => [])

    // Step 2a: 比例マッピングで初期接続を割り当て
    for (let c = 0; c < currentCount; c++) {
      const n =
        currentCount === 1
          ? 0 // 単一ノードフロア: 次フロアの最初のノードへ（step 2b で補完）
          : Math.round((c * (nextCount - 1)) / (currentCount - 1))
      conns[c]!.push(Math.min(n, nextCount - 1))
    }

    // Step 2b: 到達不可能な次フロアノードを補完
    //
    // 不変条件: Step 2a の比例マッピングにより currentCount >= 1 かつ nextCount >= 1 であれば
    // 「各次フロアノードは必ず少なくとも1つの現在フロアノードから到達可能」を保証できる。
    // currentCount=1 の場合は単一ノードが全次フロアノードに接続され、交差は発生しない。
    // それ以外の場合は比例マッピングで大部分がカバーされ、残りを以下で補完する。
    // 補完できないケースは理論上存在しないが、万一発生した場合は後段の不変条件チェックで検出する。
    const reachable = new Set<number>()
    for (const cs of conns) for (const t of cs) reachable.add(t)

    for (let t = 0; t < nextCount; t++) {
      if (reachable.has(t)) continue
      // 比例的に最も近い現在フロアノードを探す
      const targetC = Math.round((t * (currentCount - 1)) / Math.max(nextCount - 1, 1))
      const c = Math.min(targetC, currentCount - 1)
      if (!conns[c]!.includes(t) && !wouldCross(conns, c, t)) {
        conns[c]!.push(t)
        reachable.add(t)
      } else {
        // 交差なしで接続可能なノードを左右方向に探索
        for (let delta = 1; delta < currentCount; delta++) {
          for (const dc of [delta, -delta]) {
            const c2 = c + dc
            if (c2 < 0 || c2 >= currentCount) continue
            if (!conns[c2]!.includes(t) && !wouldCross(conns, c2, t)) {
              conns[c2]!.push(t)
              reachable.add(t)
              break
            }
          }
          if (reachable.has(t)) break
        }
      }
    }

    // 不変条件チェック: 全次フロアノードが到達可能であること
    /* istanbul ignore next -- アルゴリズムの不変条件違反は開発時に検出するためのガード */
    if (reachable.size !== nextCount) {
      throw new Error(
        `[MapGenerator] 不変条件違反: floor ${f} -> ${f + 1} にて ` +
          `${nextCount - reachable.size} 個の次フロアノードが到達不可能 (seed="${seed.value}")`,
      )
    }

    // Step 2c: ランダムな追加接続（最大2本/ノード、40%の確率）
    for (let c = 0; c < currentCount; c++) {
      if (conns[c]!.length >= 2 || rng() >= 0.4) continue
      const existing = conns[c]![0]!
      for (const delta of [-1, 1]) {
        const n = existing + delta
        if (n >= 0 && n < nextCount && !conns[c]!.includes(n) && !wouldCross(conns, c, n)) {
          conns[c]!.push(n)
          break
        }
      }
    }

    // 接続情報をノードに適用（不変オブジェクト生成）
    for (let c = 0; c < currentCount; c++) {
      const node = currentFloor[c]!
      const connIds: readonly NodeId[] = conns[c]!.map((n) => nextFloor[n]!.id)
      allFloors[f]![c] = { ...node, connections: connIds }
    }
  }

  return allFloors
}
