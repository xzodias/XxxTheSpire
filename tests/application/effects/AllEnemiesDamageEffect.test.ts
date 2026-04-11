import { describe, it, expect, vi } from 'vitest'
import { AllEnemiesDamageEffect } from '../../../src/application/effects/AllEnemiesDamageEffect'
import {
  type Effect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from '../../../src/application/effects/Effect'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type StatusEffect, StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId, type StatusEffectId } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Gold } from '../../../src/domain/value-objects/Gold'

// ─────────────────────────────────────────────
// Test helpers
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
    powers: [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makePlayer(statusEffects: StatusEffect[] = []): Player {
  const health = Health.create(80, 80)
  const energy = Energy.create(3, 3)
  const gold = Gold.create(0)
  const block = Block.create(0)
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
    powers: [],
    statusEffects,
  }
}

function makeServices(): EffectServices {
  return {
    random: {
      next: vi.fn(() => 0),
      nextInt: vi.fn((min: number) => min),
      shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [
        ...array,
      ]) as IRandomService['shuffle'],
    },
  }
}

function makeBattleState(enemies: readonly Enemy[], player?: Player): BattleState {
  return {
    player: player ?? makePlayer(),
    enemies,
  }
}

function makeAllContext(): EffectContext {
  return { target: { kind: 'all' } }
}

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect — インターフェース適合
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect - Effect インターフェース適合', () => {
  it('Effect インターフェースを実装している', () => {
    const effect: Effect = new AllEnemiesDamageEffect(10)
    expect(effect).toBeDefined()
  })

  it('正の整数値で構築できる', () => {
    const effect = new AllEnemiesDamageEffect(10)
    expect(effect).toBeInstanceOf(AllEnemiesDamageEffect)
  })

  it('targetKind が "all" である', () => {
    const effect = new AllEnemiesDamageEffect(10)
    expect(effect.targetKind).toBe('all')
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect — 生成・コンストラクタ
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect - 生成', () => {
  it('観点02: value=0 で正常に生成できる（境界値：最小正常値）', () => {
    expect(() => new AllEnemiesDamageEffect(0)).not.toThrow()
  })

  it('観点01: value=1 で正常に生成できる', () => {
    expect(() => new AllEnemiesDamageEffect(1)).not.toThrow()
  })

  it('観点01: value が負のとき生成時にエラーを投げる（下限違反）', () => {
    expect(() => new AllEnemiesDamageEffect(-1)).toThrow()
  })

  it('観点07: value が NaN のとき生成時にエラーを投げる', () => {
    expect(() => new AllEnemiesDamageEffect(NaN)).toThrow()
  })

  it('観点07: value が Infinity のとき生成時にエラーを投げる', () => {
    expect(() => new AllEnemiesDamageEffect(Infinity)).toThrow()
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — AC7: 全体攻撃
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - AC7: 全体攻撃', () => {
  it('観点01: 敵が1体のとき、その敵のHPが減る', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const state = makeBattleState([enemy])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(40)
  })

  it('観点01: 敵が2体のとき、全ての敵のHPが減る', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 0 })
    const state = makeBattleState([enemy1, enemy2])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    const resultEnemy1 = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    const resultEnemy2 = result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))
    expect(resultEnemy1?.health.current).toBe(40)
    expect(resultEnemy2?.health.current).toBe(20)
  })

  it('観点01: 敵が3体のとき、全ての敵のHPが減る', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 0 })
    const enemy3 = makeEnemy('fungi_beast', { currentHp: 40, maxHp: 40, block: 0 })
    const state = makeBattleState([enemy1, enemy2, enemy3])
    const effect = new AllEnemiesDamageEffect(8)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current).toBe(42)
    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))?.health.current).toBe(22)
    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('fungi_beast'))?.health.current).toBe(32)
  })

  it('観点02: 敵が0体のとき state をそのまま返す（境界値：空配列）', () => {
    const state = makeBattleState([])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.enemies).toHaveLength(0)
    expect(result.enemies).toStrictEqual(state.enemies)
  })

  it('観点02: value=0 のとき全ての敵のHPが変わらない（境界値）', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30 })
    const state = makeBattleState([enemy1, enemy2])
    const effect = new AllEnemiesDamageEffect(0)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current).toBe(50)
    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))?.health.current).toBe(30)
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — AC7: ブロック吸収
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - AC7: ブロック吸収（全体攻撃）', () => {
  it('観点01: 各敵のブロックが先に消費されてから HP に適用される', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 5 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 15 })
    const state = makeBattleState([enemy1, enemy2])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    const resultEnemy1 = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    const resultEnemy2 = result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))
    // enemy1: block=5 absorbed, 10-5=5 damage to hp → 45
    expect(resultEnemy1?.health.current).toBe(45)
    expect(resultEnemy1?.block.value).toBe(0)
    // enemy2: block=15 > damage=10, hp unchanged, block=5
    expect(resultEnemy2?.health.current).toBe(30)
    expect(resultEnemy2?.block.value).toBe(5)
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — AC7: 状態効果（Vulnerable）
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - AC7: 脆弱な敵への全体攻撃', () => {
  it('観点16: Vulnerable な敵と通常の敵が混在するとき各自の倍率が適用される', () => {
    const normalEnemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const vulnerableEnemy = makeEnemy('louse', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    const state = makeBattleState([normalEnemy, vulnerableEnemy])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    const resultNormal = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    const resultVulnerable = result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))
    // normalEnemy: 50 - 10 = 40
    expect(resultNormal?.health.current).toBe(40)
    // vulnerableEnemy: 50 - floor(10 * 1.5) = 50 - 15 = 35
    expect(resultVulnerable?.health.current).toBe(35)
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — AC7: Weak（攻撃者）
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - AC7: 弱体化プレイヤーの全体攻撃', () => {
  it('観点01: プレイヤーが Weak(duration=1) のとき全ての敵に ×0.75 floor ダメージを与える', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 0 })
    const player = makePlayer([makeStatusEffect(StatusEffectType.Weak, 0, 1)])
    const state = makeBattleState([enemy1, enemy2], player)
    // base=10, floor(10 * 0.75) = 7
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current).toBe(43)
    expect(result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))?.health.current).toBe(23)
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — イミュータビリティ
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - イミュータビリティ（観点11）', () => {
  it('apply は元の BattleState を変更しない', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30 })
    const state = makeBattleState([enemy1, enemy2])
    const originalHp1 = state.enemies[0]?.health.current
    const originalHp2 = state.enemies[1]?.health.current
    const effect = new AllEnemiesDamageEffect(10)

    effect.apply(state, makeAllContext(), makeServices())

    expect(state.enemies[0]?.health.current).toBe(originalHp1)
    expect(state.enemies[1]?.health.current).toBe(originalHp2)
  })

  it('apply は元の Enemy オブジェクトを変更せず新しいオブジェクトを返す', () => {
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30 })
    const state = makeBattleState([enemy1, enemy2])
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.enemies[0]).not.toBe(state.enemies[0])
    expect(result.enemies[1]).not.toBe(state.enemies[1])
  })

  it('apply は player を変更しない', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const player = makePlayer()
    const state = makeBattleState([enemy], player)
    const effect = new AllEnemiesDamageEffect(10)

    const result = effect.apply(state, makeAllContext(), makeServices())

    expect(result.player).toBe(state.player)
  })
})

// ─────────────────────────────────────────────
// AllEnemiesDamageEffect.apply — 冪等性
// ─────────────────────────────────────────────

describe('AllEnemiesDamageEffect.apply - 冪等性（観点28）', () => {
  it('同一の BattleState で複数回呼んでも毎回同じ結果になる', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const effect = new AllEnemiesDamageEffect(10)

    const state1 = makeBattleState([makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })])
    const state2 = makeBattleState([makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })])
    const result1 = effect.apply(state1, makeAllContext(), makeServices())
    const result2 = effect.apply(state2, makeAllContext(), makeServices())

    void enemy // suppress unused warning
    expect(result1.enemies[0]?.health.current).toBe(result2.enemies[0]?.health.current)
  })
})
