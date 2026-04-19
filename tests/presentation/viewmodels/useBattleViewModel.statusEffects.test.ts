/**
 * useBattleViewModel 状態効果テスト（RED フェーズ）
 *
 * 対象: src/presentation/viewmodels/useBattleViewModel.ts の拡張アクション（未実装）
 *   - endPlayerTurn()   — 全コンバタントの持続型 StatusEffect を tick
 *   - startPlayerTurn() — プレイヤーの Block をリセット、Poison ダメージを処理
 *   - startEnemyTurn()  — 敵全員の Block をリセット、敵の Poison ダメージを処理
 *
 * カバー AC:
 *   AC1 — startPlayerTurn / startEnemyTurn でスタック型エフェクトが保持される
 *   AC2 — endPlayerTurn で Vulnerable / Weak の duration が減る
 *   AC4 — startPlayerTurn でプレイヤーの Poison がダメージを与え stacks が 1 減る
 *   AC5 — startPlayerTurn でプレイヤーの block が 0 になる
 *         startEnemyTurn で敵の block が 0 になる
 *
 * AC3（UI 表示）はこのファイルではテスト対象外とする。
 * UI 層のテストは presentation/ 配下のコンポーネントテストで別途実施すること。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBattleViewModel } from '../../../src/presentation/viewmodels/useBattleViewModel'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type StatusEffect, StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { type Power } from '../../../src/domain/entities/Power'
import { PoisonPower } from '../../../src/domain/entities/powers/PoisonPower'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId, type StatusEffectId } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Gold } from '../../../src/domain/value-objects/Gold'

// ─────────────────────────────────────────────
// Test helpers（useBattleViewModel.test.ts と同等）
// ─────────────────────────────────────────────

function makeEnemyId(id: string): EnemyId {
  return id as EnemyId
}

function makeStatusEffect(type: StatusEffectType, stacks: number, duration: number): StatusEffect {
  return {
    id: `${type}_test` as StatusEffectId,
    name: type,
    type,
    stacks,
    duration,
  }
}

function makeEnemy(
  id: string,
  overrides?: Partial<{
    currentHp: number
    maxHp: number
    block: number
    statusEffects: StatusEffect[]
    powers: Power[]
  }>,
): Enemy {
  const hp = Health.create(overrides?.currentHp ?? 50, overrides?.maxHp ?? 50)
  const block = Block.create(overrides?.block ?? 0)
  if (!hp.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id,
    name: `Enemy_${id}`,
    enemyId: makeEnemyId(id),
    intent: { type: 'unknown' },
    health: hp.value,
    block: block.value,
    powers: overrides?.powers ?? [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makePlayer(
  overrides?: Partial<{
    currentHp: number
    maxHp: number
    block: number
    statusEffects: StatusEffect[]
    powers: Power[]
  }>,
): Player {
  const health = Health.create(overrides?.currentHp ?? 80, overrides?.maxHp ?? 80)
  const energy = Energy.create(3, 3)
  const gold = Gold.create(0)
  const block = Block.create(overrides?.block ?? 0)
  if (!health.ok) throw new Error('Failed to create health')
  if (!energy.ok) throw new Error('Failed to create energy')
  if (!gold.ok) throw new Error('Failed to create gold')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id: 'ironclad',
    name: 'Ironclad',
    health: health.value,
    energy: energy.value,
    gold: gold.value,
    block: block.value,
    deck: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: overrides?.powers ?? [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makeRandomService(): IRandomService {
  return {
    next: vi.fn(() => 0),
    nextInt: vi.fn((min: number) => min),
    shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [
      ...array,
    ]) as IRandomService['shuffle'],
  }
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  useBattleViewModel.setState({
    battleData: { status: 'idle' },
  })
})

// ─────────────────────────────────────────────
// AC5: startPlayerTurn — プレイヤーの Block リセット
// ─────────────────────────────────────────────

describe('useBattleViewModel - startPlayerTurn: AC5 プレイヤーの block リセット', () => {
  it('観点01: 正常系 — startPlayerTurn を呼ぶとプレイヤーの block が 0 になる', () => {
    const player = makePlayer({ block: 10 })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.block.value).toBe(0)
  })

  it('観点02: 境界値 — block=0 のプレイヤーに startPlayerTurn を呼んでも block=0 のまま', () => {
    const player = makePlayer({ block: 0 })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.block.value).toBe(0)
  })

  it('観点11: イミュータビリティ — startPlayerTurn は元の player オブジェクトを変更しない', () => {
    const player = makePlayer({ block: 5 })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const originalBlock = player.block.value
    useBattleViewModel.getState().startPlayerTurn()

    expect(player.block.value).toBe(originalBlock)
  })
})

// ─────────────────────────────────────────────
// AC5: startEnemyTurn — 敵の Block リセット
// ─────────────────────────────────────────────

describe('useBattleViewModel - startEnemyTurn: AC5 敵の block リセット', () => {
  it('観点01: 正常系 — startEnemyTurn を呼ぶと全ての敵の block が 0 になる', () => {
    const player = makePlayer()
    const enemy1 = makeEnemy('jaw_worm', { block: 8 })
    const enemy2 = makeEnemy('louse', { block: 5 })
    useBattleViewModel.getState().initBattle(player, [enemy1, enemy2], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.enemies.find((e) => e.id === 'jaw_worm')?.block.value).toBe(0)
    expect(battleData.enemies.find((e) => e.id === 'louse')?.block.value).toBe(0)
  })

  it('観点02: 境界値 — block=0 の敵に startEnemyTurn を呼んでも block=0 のまま', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.enemies.find((e) => e.id === 'jaw_worm')?.block.value).toBe(0)
  })

  it('観点11: イミュータビリティ — startEnemyTurn は元の enemies 配列を変更しない', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { block: 6 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const originalBlock = enemy.block.value
    useBattleViewModel.getState().startEnemyTurn()

    expect(enemy.block.value).toBe(originalBlock)
  })
})

// ─────────────────────────────────────────────
// AC4: startPlayerTurn — Poison ダメージ処理
// ─────────────────────────────────────────────

describe('useBattleViewModel - startPlayerTurn: AC4 Poison ダメージ', () => {
  it('観点01: 正常系 — プレイヤーが PoisonPower(stacks=3) を持つとき startPlayerTurn で HP が 3 減り stacks が 1 減る（stacks=2 になる）', () => {
    const player = makePlayer({
      currentHp: 50,
      maxHp: 50,
      powers: [new PoisonPower(3)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.health.current).toBe(47)
    const poison = battleData.player.powers.find((p) => p.id === 'poison')
    expect(poison?.stacks).toBe(2)
  })

  it('観点02: 境界値 — PoisonPower(stacks=1) のとき startPlayerTurn で HP が 1 減り、PoisonPower が除去される', () => {
    const player = makePlayer({
      currentHp: 50,
      maxHp: 50,
      powers: [new PoisonPower(1)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.health.current).toBe(49)
    const poison = battleData.player.powers.find((p) => p.id === 'poison')
    expect(poison).toBeUndefined()
  })

  it('観点01: 正常系 — PoisonPower を持たないプレイヤーは startPlayerTurn で HP が変化しない', () => {
    const player = makePlayer({ currentHp: 50, maxHp: 50 })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.health.current).toBe(50)
  })

  it('観点16: 組み合わせ — PoisonPower(stacks=3) かつ block=5 のとき、block がリセットされてから Poison ダメージが HP に直接入る', () => {
    // startPlayerTurn の処理順: (1) block を 0 にリセット → (2) Poison ダメージ（block 0 なので HP に直撃）
    const player = makePlayer({
      currentHp: 50,
      maxHp: 50,
      block: 5,
      powers: [new PoisonPower(3)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.block.value).toBe(0)
    expect(battleData.player.health.current).toBe(47)
  })
})

// ─────────────────────────────────────────────
// AC2: endPlayerTurn — 持続ターン型 StatusEffect の tick
// ─────────────────────────────────────────────

describe('useBattleViewModel - endPlayerTurn: AC2 持続ターン型 StatusEffect の tick', () => {
  it('観点01: 正常系 — Vulnerable(duration=2) を持つプレイヤーに endPlayerTurn を呼ぶと duration=1 になる', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const vulnerable = battleData.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable?.duration).toBe(1)
  })

  it('観点13: 有効遷移 — Weak(duration=1) を持つプレイヤーに endPlayerTurn を呼ぶと Weak が消滅する', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Weak, 0, 1)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const weak = battleData.player.statusEffects.find((s) => s.type === StatusEffectType.Weak)
    expect(weak).toBeUndefined()
  })

  it('観点01: 正常系 — Strength（スタック型）は endPlayerTurn で stacks が変化しない', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Strength, 4, 0)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const strength = battleData.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Strength,
    )
    expect(strength?.stacks).toBe(4)
  })

  it('観点16: 組み合わせ — endPlayerTurn はプレイヤーの Vulnerable のみ tick し、敵の Weak は変化しない', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)],
    })
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Weak, 0, 1)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')

    const playerVulnerable = battleData.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    const enemyWeak = battleData.enemies
      .find((e) => e.id === 'jaw_worm')
      ?.statusEffects.find((s) => s.type === StatusEffectType.Weak)

    expect(playerVulnerable?.duration).toBe(1)
    expect(enemyWeak?.duration).toBe(1) // 敵の Weak は endPlayerTurn では tick されない
  })
})

// ─────────────────────────────────────────────
// AC2: endEnemyTurn — 敵の持続ターン型 StatusEffect の tick
// ─────────────────────────────────────────────

describe('useBattleViewModel - endEnemyTurn: AC2 敵の持続ターン型 StatusEffect の tick', () => {
  it('観点01: 正常系 — Vulnerable(duration=2) を持つ敵に endEnemyTurn を呼ぶと duration=1 になる', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    const vulnerable = resultEnemy?.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable?.duration).toBe(1)
  })

  it('観点13: 有効遷移 — Weak(duration=1) を持つ敵に endEnemyTurn を呼ぶと Weak が消滅する', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Weak, 0, 1)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    const weak = resultEnemy?.statusEffects.find((s) => s.type === StatusEffectType.Weak)
    expect(weak).toBeUndefined()
  })

  it('観点16: 組み合わせ — endEnemyTurn は敵の Weak のみ tick し、プレイヤーの Vulnerable は変化しない', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)],
    })
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Weak, 0, 1)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().endEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')

    const playerVulnerable = battleData.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    const enemyWeak = battleData.enemies
      .find((e) => e.id === 'jaw_worm')
      ?.statusEffects.find((s) => s.type === StatusEffectType.Weak)

    expect(playerVulnerable?.duration).toBe(2) // プレイヤーの Vulnerable は endEnemyTurn では tick されない
    expect(enemyWeak).toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// AC4: startEnemyTurn — 敵の Poison ダメージ処理
// ─────────────────────────────────────────────

describe('useBattleViewModel - startEnemyTurn: AC4 敵の Poison ダメージ', () => {
  it('観点01: 正常系 — PoisonPower(stacks=3) を持つ敵の startEnemyTurn で HP が 3 減り stacks が 1 減る（stacks=2 になる）', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 40,
      maxHp: 40,
      powers: [new PoisonPower(3)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    expect(resultEnemy?.health.current).toBe(37)
    const poison = resultEnemy?.powers.find((p) => p.id === 'poison')
    expect(poison?.stacks).toBe(2)
  })

  it('観点02: 境界値 — PoisonPower(stacks=1) の敵の startEnemyTurn で HP が 1 減り、PoisonPower が除去される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 40,
      maxHp: 40,
      powers: [new PoisonPower(1)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    expect(resultEnemy?.health.current).toBe(39)
    const poison = resultEnemy?.powers.find((p) => p.id === 'poison')
    expect(poison).toBeUndefined()
  })

  it('観点01: 正常系 — PoisonPower を持たない敵は startEnemyTurn で HP が変化しない', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { currentHp: 40, maxHp: 40 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    expect(resultEnemy?.health.current).toBe(40)
  })
})

// ─────────────────────────────────────────────
// AC1: startPlayerTurn / startEnemyTurn — スタック型は保持
// ─────────────────────────────────────────────

describe('useBattleViewModel - AC1: ターン移行でスタック型 StatusEffect が保持される', () => {
  it('観点01: startPlayerTurn でプレイヤーの Strength(stacks=3) が変化しない', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Strength, 3, 0)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startPlayerTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const strength = battleData.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Strength,
    )
    expect(strength?.stacks).toBe(3)
  })

  it('観点01: startEnemyTurn で敵の Strength(stacks=2) が変化しない', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Strength, 2, 0)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    useBattleViewModel.getState().startEnemyTurn()

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.id === 'jaw_worm')
    const strength = resultEnemy?.statusEffects.find((s) => s.type === StatusEffectType.Strength)
    expect(strength?.stacks).toBe(2)
  })
})
