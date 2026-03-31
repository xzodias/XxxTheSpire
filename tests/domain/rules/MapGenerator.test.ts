import { describe, it, expect } from 'vitest'
import { generateMap } from '../../../src/domain/rules/MapGenerator'
import { NodeType } from '../../../src/domain/enums/NodeType'
import { Seed } from '../../../src/domain/value-objects/Seed'

// テスト用シードヘルパー（Seed.create の Result アンラップを一元化）
function makeSeed(value: string): Seed {
  const result = Seed.create(value)
  if (!result.ok) throw new Error(`Invalid seed: ${result.error}`)
  return result.value
}

const SEED = makeSeed('test-seed-42')
const FLOORS = 15
const WIDTH = 3

// ──────────────────────────────────────────────────────────
// Return shape
// ──────────────────────────────────────────────────────────
describe('generateMap - return shape', () => {
  it('returns `floors` floor arrays', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map).toHaveLength(FLOORS)
  })

  it('each floor is an array', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (const floor of map) {
      expect(Array.isArray(floor)).toBe(true)
    }
  })

  it('node.floor matches its array index', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 0; f < FLOORS; f++) {
      for (const node of map[f]!) {
        expect(node.floor).toBe(f)
      }
    }
  })

  it('every node has a unique id', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    const ids = map.flat().map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('visited is false on every node', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (const node of map.flat()) {
      expect(node.visited).toBe(false)
    }
  })

  it('connections is an array on every node', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (const node of map.flat()) {
      expect(Array.isArray(node.connections)).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────
// Floor constraints
// ──────────────────────────────────────────────────────────
describe('generateMap - floor constraints', () => {
  it('floor 0 contains only Combat nodes', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (const node of map[0]!) {
      expect(node.type).toBe(NodeType.Combat)
    }
  })

  it('floor 0 has at least one node', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map[0]!.length).toBeGreaterThanOrEqual(1)
  })

  it('floor 0 has at most width nodes', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map[0]!.length).toBeLessThanOrEqual(WIDTH)
  })

  it('boss floor (last) contains exactly one node', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map[FLOORS - 1]!).toHaveLength(1)
  })

  it('boss floor node has type Boss', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map[FLOORS - 1]![0]!.type).toBe(NodeType.Boss)
  })

  it('boss floor node has no outgoing connections', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    expect(map[FLOORS - 1]![0]!.connections).toHaveLength(0)
  })

  it('middle floors are non-empty', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 1; f < FLOORS - 1; f++) {
      expect(map[f]!.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('middle floors have at most width nodes', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 1; f < FLOORS - 1; f++) {
      expect(map[f]!.length).toBeLessThanOrEqual(WIDTH)
    }
  })

  it('Boss type never appears before the final floor', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 0; f < FLOORS - 1; f++) {
      for (const node of map[f]!) {
        expect(node.type).not.toBe(NodeType.Boss)
      }
    }
  })

  it('Elite and Rest never appear on floor 0', () => {
    // Run many times to be statistically confident
    for (let i = 0; i < 20; i++) {
      const map = generateMap(makeSeed(`seed-${i}`), FLOORS, WIDTH)
      for (const node of map[0]!) {
        expect(node.type).not.toBe(NodeType.Elite)
        expect(node.type).not.toBe(NodeType.Rest)
      }
    }
  })
})

// ──────────────────────────────────────────────────────────
// Node type distribution
// ──────────────────────────────────────────────────────────
describe('generateMap - node types', () => {
  it('only valid NodeType values appear', () => {
    const validTypes = new Set<string>(Object.values(NodeType))
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (const node of map.flat()) {
      expect(validTypes.has(node.type)).toBe(true)
    }
  })

  it('a large map contains non-Combat variety', () => {
    const map = generateMap(SEED, 15, 4)
    const types = map.flat().map((n) => n.type)
    const unique = new Set(types)
    expect(unique.size).toBeGreaterThan(1)
  })
})

// ──────────────────────────────────────────────────────────
// Connectivity
// ──────────────────────────────────────────────────────────
describe('generateMap - connectivity', () => {
  it('non-boss nodes each have at least one outgoing connection', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 0; f < FLOORS - 1; f++) {
      for (const node of map[f]!) {
        expect(node.connections.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('all connections reference valid NodeIds on the next floor', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 0; f < FLOORS - 1; f++) {
      const nextIds = new Set(map[f + 1]!.map((n) => n.id))
      for (const node of map[f]!) {
        for (const connId of node.connections) {
          expect(nextIds.has(connId)).toBe(true)
        }
      }
    }
  })

  it('every node on floor f>0 has at least one incoming connection', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    for (let f = 1; f < FLOORS; f++) {
      const reachable = new Set<string>()
      for (const node of map[f - 1]!) {
        for (const id of node.connections) reachable.add(id)
      }
      for (const node of map[f]!) {
        expect(reachable.has(node.id)).toBe(true)
      }
    }
  })

  it('connections never skip floors', () => {
    const map = generateMap(SEED, FLOORS, WIDTH)
    const allNodeIds = new Map<string, number>()
    for (let f = 0; f < FLOORS; f++) {
      for (const node of map[f]!) allNodeIds.set(node.id, f)
    }
    for (let f = 0; f < FLOORS - 1; f++) {
      for (const node of map[f]!) {
        for (const connId of node.connections) {
          expect(allNodeIds.get(connId)).toBe(f + 1)
        }
      }
    }
  })
})

// ──────────────────────────────────────────────────────────
// No crossing connections
// ──────────────────────────────────────────────────────────
describe('generateMap - no crossing connections', () => {
  function checkNoCrossings(map: ReturnType<typeof generateMap>): void {
    const floors = map.length
    for (let f = 0; f < floors - 1; f++) {
      const currentFloor = map[f]!
      const nextFloor = map[f + 1]!
      const nextIdToIndex = new Map(nextFloor.map((n, i) => [n.id, i]))

      for (let c1 = 0; c1 < currentFloor.length; c1++) {
        for (let c2 = c1 + 1; c2 < currentFloor.length; c2++) {
          const conns1 = currentFloor[c1]!.connections.map((id) => nextIdToIndex.get(id)!)
          const conns2 = currentFloor[c2]!.connections.map((id) => nextIdToIndex.get(id)!)
          // c1 is left of c2, so all targets from c1 must be <= all targets from c2
          for (const n1 of conns1) {
            for (const n2 of conns2) {
              expect(n1).toBeLessThanOrEqual(n2)
            }
          }
        }
      }
    }
  }

  it('no connections cross with width=3', () => {
    checkNoCrossings(generateMap(SEED, FLOORS, 3))
  })

  it('no connections cross with width=2', () => {
    checkNoCrossings(generateMap(SEED, FLOORS, 2))
  })

  it('no connections cross with width=5', () => {
    checkNoCrossings(generateMap(SEED, FLOORS, 5))
  })

  it('no connections cross with multiple seeds', () => {
    for (let i = 0; i < 10; i++) {
      checkNoCrossings(generateMap(makeSeed(`cross-seed-${i}`), 10, 4))
    }
  })
})

// ──────────────────────────────────────────────────────────
// Determinism
// ──────────────────────────────────────────────────────────
describe('generateMap - determinism', () => {
  it('same seed + same arguments produce identical maps', () => {
    const map1 = generateMap(SEED, FLOORS, WIDTH)
    const map2 = generateMap(SEED, FLOORS, WIDTH)
    expect(map1).toEqual(map2)
  })

  it('different seeds produce different maps', () => {
    const map1 = generateMap(makeSeed('alpha-seed'), FLOORS, WIDTH)
    const map2 = generateMap(makeSeed('beta-seed'), FLOORS, WIDTH)
    const types1 = map1
      .flat()
      .map((n) => n.type)
      .join(',')
    const types2 = map2
      .flat()
      .map((n) => n.type)
      .join(',')
    expect(types1).not.toBe(types2)
  })

  it('returned arrays are distinct references across calls', () => {
    const map1 = generateMap(SEED, FLOORS, WIDTH)
    const map2 = generateMap(SEED, FLOORS, WIDTH)
    expect(map1).not.toBe(map2)
    expect(map1[0]).not.toBe(map2[0])
    expect(map1[0]![0]).not.toBe(map2[0]![0])
  })
})

// ──────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────
describe('generateMap - edge cases', () => {
  it('floors=2: floor[0]=Combat, floor[1]=Boss', () => {
    const map = generateMap(SEED, 2, 3)
    expect(map).toHaveLength(2)
    for (const node of map[0]!) {
      expect(node.type).toBe(NodeType.Combat)
    }
    expect(map[1]![0]!.type).toBe(NodeType.Boss)
  })

  it('width=1: every floor has exactly one node (linear map)', () => {
    const map = generateMap(SEED, 5, 1)
    for (const floor of map) {
      expect(floor).toHaveLength(1)
    }
  })

  it('width=1: each node has exactly one connection (except boss)', () => {
    const map = generateMap(SEED, 5, 1)
    for (let f = 0; f < 4; f++) {
      expect(map[f]![0]!.connections).toHaveLength(1)
    }
    expect(map[4]![0]!.connections).toHaveLength(0)
  })
})
