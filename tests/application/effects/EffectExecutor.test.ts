import { describe, it, expect, vi } from 'vitest'
import { executeEffects } from '../../../src/application/effects/EffectExecutor'
import { DamageEffect } from '../../../src/application/effects/DamageEffect'
import { BlockEffect } from '../../../src/application/effects/BlockEffect'
import { DrawEffect } from '../../../src/application/effects/DrawEffect'
import {
  type Effect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from '../../../src/application/effects/Effect'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId, type Target } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Gold } from '../../../src/domain/value-objects/Gold'
import { CardType } from '../../../src/domain/enums/CardType'
import { Rarity } from '../../../src/domain/enums/Rarity'
import { TargetType } from '../../../src/domain/enums/TargetType'
import { type CardId } from '../../../src/shared/types'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeEnemyId(id: string): EnemyId {
  return id as EnemyId
}

function makeEnemy(
  id: string,
  overrides?: Partial<{ currentHp: number; maxHp: number; block: number }>,
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
    powers: [],
    statusEffects: [],
  }
}

function makeCardId(id: string): CardId {
  return id as CardId
}

function makeCards(count: number, prefix = 'card') {
  return Array.from({ length: count }, (_, i) => ({
    id: makeCardId(`${prefix}_${i}`),
    name: `${prefix}_${i}`,
    description: `${prefix}_${i} description`,
    cost: 1,
    type: CardType.Attack,
    rarity: Rarity.Common,
    targetType: TargetType.Single,
    effects: [],
    upgraded: false,
  }))
}

function makePlayer(overrides?: Partial<{ block: number; deckSize: number }>): Player {
  const health = Health.create(80, 80)
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
    deck: makeCards(overrides?.deckSize ?? 5),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: [],
    statusEffects: [],
  }
}

function makeServices(): EffectServices {
  return {
    random: {
      next: vi.fn(() => 0),
      nextInt: vi.fn((min: number) => min),
      shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [...array]) as IRandomService['shuffle'],
    },
  }
}

function makeBattleState(player: Player, enemies: readonly Enemy[] = []): BattleState {
  return { player, enemies }
}

function makeContext(target?: Target): EffectContext {
  return { target }
}

// ─────────────────────────────────────────────
// executeEffects — 基本動作 (AC1)
// ─────────────────────────────────────────────

describe('executeEffects - 基本動作', () => {
  it('エフェクトが空のとき初期 state をそのまま返す', () => {
    const player = makePlayer()
    const state = makeBattleState(player)

    const result = executeEffects([], state, makeContext(), makeServices())

    expect(result).toStrictEqual(state)
  })

  it('単一の BlockEffect が実行される', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)

    const result = executeEffects([new BlockEffect(5)], state, makeContext(), makeServices())

    expect(result.player.block.value).toBe(5)
  })

  it('単一の DrawEffect が実行される', () => {
    const player = makePlayer({ deckSize: 5 })
    const state = makeBattleState(player)

    const result = executeEffects([new DrawEffect(2)], state, makeContext(), makeServices())

    expect(result.player.hand).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────
// executeEffects — 複数エフェクトの順番実行 (AC1, AC2)
// ─────────────────────────────────────────────

describe('executeEffects - 複数エフェクトの順番実行', () => {
  it('AC2: 複数エフェクトが全て実行される（DamageEffect + BlockEffect）', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player, [enemy])

    const result = executeEffects(
      [new DamageEffect(10), new BlockEffect(5)],
      state,
      makeContext(target),
      makeServices(),
    )

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(40)
    expect(result.player.block.value).toBe(5)
  })

  it('AC2: 複数エフェクトが全て実行される（BlockEffect + DrawEffect）', () => {
    const player = makePlayer({ block: 0, deckSize: 5 })
    const state = makeBattleState(player)

    const result = executeEffects(
      [new BlockEffect(5), new DrawEffect(2)],
      state,
      makeContext(),
      makeServices(),
    )

    expect(result.player.block.value).toBe(5)
    expect(result.player.hand).toHaveLength(2)
  })

  it('エフェクトが順番に適用される（前のエフェクト結果が次のエフェクトに引き継がれる）', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)

    const result = executeEffects(
      [new BlockEffect(5), new BlockEffect(3)],
      state,
      makeContext(),
      makeServices(),
    )

    expect(result.player.block.value).toBe(8)
  })

  it('3つのエフェクトが全て順番に実行される', () => {
    const player = makePlayer({ block: 0, deckSize: 10 })
    const state = makeBattleState(player)

    const result = executeEffects(
      [new BlockEffect(5), new BlockEffect(3), new DrawEffect(1)],
      state,
      makeContext(),
      makeServices(),
    )

    expect(result.player.block.value).toBe(8)
    expect(result.player.hand).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// executeEffects — AC1: カードをプレイするとエフェクトが順番に実行される
// ─────────────────────────────────────────────

describe('executeEffects - AC1: カードプレイシミュレーション', () => {
  it('DamageEffect + DrawEffect で攻撃してドロー（攻撃カードのシミュレーション）', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayer({ deckSize: 5 })
    const state = makeBattleState(player, [enemy])

    const result = executeEffects(
      [new DamageEffect(6), new DrawEffect(1)],
      state,
      makeContext(target),
      makeServices(),
    )

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(44)
    expect(result.player.hand).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// executeEffects — イミュータビリティ (観点11)
// ─────────────────────────────────────────────

describe('executeEffects - イミュータビリティ', () => {
  it('executeEffects は元の BattleState を変更しない', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)
    const originalBlockValue = state.player.block.value

    executeEffects([new BlockEffect(5)], state, makeContext(), makeServices())

    expect(state.player.block.value).toBe(originalBlockValue)
  })

  it('executeEffects の戻り値は新しい BattleState オブジェクト', () => {
    const player = makePlayer()
    const state = makeBattleState(player)

    const result = executeEffects([new BlockEffect(5)], state, makeContext(), makeServices())

    expect(result).not.toBe(state)
  })
})

// ─────────────────────────────────────────────
// executeEffects — モック経由での実行確認
// ─────────────────────────────────────────────

describe('executeEffects - モックエフェクトによる実行確認', () => {
  it('各エフェクトの apply が1回ずつ呼ばれる', () => {
    const player = makePlayer()
    const state = makeBattleState(player)
    const services = makeServices()
    const context = makeContext()

    const mockEffect1: Effect = { apply: vi.fn((s) => s) }
    const mockEffect2: Effect = { apply: vi.fn((s) => s) }

    executeEffects([mockEffect1, mockEffect2], state, context, services)

    expect(mockEffect1.apply).toHaveBeenCalledTimes(1)
    expect(mockEffect2.apply).toHaveBeenCalledTimes(1)
  })

  it('エフェクトが順番に呼ばれる（前の戻り値が次の入力になる）', () => {
    const player = makePlayer()
    const initialState = makeBattleState(player)
    const services = makeServices()
    const context = makeContext()

    const intermediateState: BattleState = { ...initialState }
    const finalState: BattleState = { ...initialState }

    const mockEffect1: Effect = { apply: vi.fn(() => intermediateState) }
    const mockEffect2: Effect = { apply: vi.fn(() => finalState) }

    const result = executeEffects([mockEffect1, mockEffect2], initialState, context, services)

    // effect1 は initialState を受け取る
    expect(mockEffect1.apply).toHaveBeenCalledWith(initialState, context, services)
    // effect2 は effect1 の戻り値（intermediateState）を受け取る
    expect(mockEffect2.apply).toHaveBeenCalledWith(intermediateState, context, services)
    // 最終結果は effect2 の戻り値
    expect(result).toBe(finalState)
  })

  it('context が全エフェクトに同一オブジェクトとして渡される', () => {
    const player = makePlayer()
    const state = makeBattleState(player)
    const services = makeServices()
    const context = makeContext()

    const mockEffect1: Effect = { apply: vi.fn((s) => s) }
    const mockEffect2: Effect = { apply: vi.fn((s) => s) }

    executeEffects([mockEffect1, mockEffect2], state, context, services)

    expect(mockEffect1.apply).toHaveBeenCalledWith(expect.anything(), context, services)
    expect(mockEffect2.apply).toHaveBeenCalledWith(expect.anything(), context, services)
  })

  it('services が全エフェクトに同一オブジェクトとして渡される', () => {
    const player = makePlayer()
    const state = makeBattleState(player)
    const services = makeServices()
    const context = makeContext()

    const mockEffect1: Effect = { apply: vi.fn((s) => s) }
    const mockEffect2: Effect = { apply: vi.fn((s) => s) }

    executeEffects([mockEffect1, mockEffect2], state, context, services)

    expect(mockEffect1.apply).toHaveBeenCalledWith(expect.anything(), context, services)
    expect(mockEffect2.apply).toHaveBeenCalledWith(expect.anything(), context, services)
  })
})

// ─────────────────────────────────────────────
// executeEffects — AC3: 不正なエフェクトデータでシステムがクラッシュしない
// ─────────────────────────────────────────────

describe('executeEffects - AC3: エフェクトリストが空でもクラッシュしない', () => {
  it('空のエフェクト配列でクラッシュしない', () => {
    const player = makePlayer()
    const state = makeBattleState(player)

    expect(() => executeEffects([], state, makeContext(), makeServices())).not.toThrow()
  })

  it('空配列のとき戻り値は入力 state と等しい', () => {
    const player = makePlayer()
    const state = makeBattleState(player)

    const result = executeEffects([], state, makeContext(), makeServices())

    expect(result).toStrictEqual(state)
  })
})
