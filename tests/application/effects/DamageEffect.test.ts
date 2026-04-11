import { describe, it, expect, vi } from 'vitest'
import { DamageEffect } from '../../../src/application/effects/DamageEffect'
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
import { type EnemyId, type Target, type StatusEffectId } from '../../../src/shared/types'
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

function makePlayerWithStatusEffects(statusEffects: StatusEffect[]): Player {
  const player = makePlayer()
  return { ...player, statusEffects }
}

function makePlayer(): Player {
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
    statusEffects: [],
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

function makeContext(target?: Target): EffectContext {
  return { target }
}

// ─────────────────────────────────────────────
// DamageEffect — インターフェース適合
// ─────────────────────────────────────────────

describe('DamageEffect - Effect インターフェース適合', () => {
  it('Effect インターフェースを実装している', () => {
    const effect: Effect = new DamageEffect(6)
    expect(effect).toBeDefined()
  })

  it('正の整数値で構築できる', () => {
    const effect = new DamageEffect(6)
    expect(effect).toBeInstanceOf(DamageEffect)
  })

  it('targetKind が "enemy" である', () => {
    const effect = new DamageEffect(6)
    expect(effect.targetKind).toBe('enemy')
  })
})

// ─────────────────────────────────────────────
// DamageEffect — 生成・コンストラクタ (AC3, 観点05/07/10)
// ─────────────────────────────────────────────

describe('DamageEffect - 生成', () => {
  it('value=0 で正常に生成できる（境界値：最小正常値）', () => {
    expect(() => new DamageEffect(0)).not.toThrow()
  })

  it('value=1 で正常に生成できる', () => {
    expect(() => new DamageEffect(1)).not.toThrow()
  })

  it('value=999 で正常に生成できる（大きな値）', () => {
    expect(() => new DamageEffect(999)).not.toThrow()
  })

  it('value が負のとき生成時にエラーを投げる（下限違反）', () => {
    expect(() => new DamageEffect(-1)).toThrow()
  })

  it('value が NaN のとき生成時にエラーを投げる', () => {
    expect(() => new DamageEffect(NaN)).toThrow()
  })

  it('value が Infinity のとき生成時にエラーを投げる', () => {
    expect(() => new DamageEffect(Infinity)).toThrow()
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — 正常系 (AC1, 観点01/11/16)
// ─────────────────────────────────────────────

describe('DamageEffect.apply - 正常系', () => {
  describe('AC1: 対象敵にダメージが適用される', () => {
    it('target.kind=enemy で指定した敵のHPが減る', () => {
      const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy])
      const effect = new DamageEffect(10)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      expect(resultEnemy?.health.current).toBe(40)
    })

    it('複数敵がいるとき対象の敵のみHPが減る', () => {
      const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
      const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy1, enemy2])
      const effect = new DamageEffect(10)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy1 = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      const resultEnemy2 = result.enemies.find((e) => e.enemyId === makeEnemyId('louse'))
      expect(resultEnemy1?.health.current).toBe(40)
      expect(resultEnemy2?.health.current).toBe(30)
    })
  })

  describe('AC1: ブロックを持つ敵へのダメージ（ブロック吸収）', () => {
    it('blockがdamageより大きいとき敵HPは減らずブロックが減る', () => {
      const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 20 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy])
      const effect = new DamageEffect(10)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      expect(resultEnemy?.health.current).toBe(50)
      expect(resultEnemy?.block.value).toBe(10)
    })

    it('blockがdamageより小さいとき残りダメージがHPに適用される', () => {
      const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 5 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy])
      const effect = new DamageEffect(10)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      expect(resultEnemy?.health.current).toBe(45)
      expect(resultEnemy?.block.value).toBe(0)
    })

    it('blockがdamageと等しいとき敵HPは減らずブロックは0になる', () => {
      const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 10 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy])
      const effect = new DamageEffect(10)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      expect(resultEnemy?.health.current).toBe(50)
      expect(resultEnemy?.block.value).toBe(0)
    })
  })

  describe('AC1: ダメージ値=0 (境界値)', () => {
    it('value=0 のとき敵のHPとブロックは変わらない', () => {
      const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 5 })
      const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
      const state = makeBattleState([enemy])
      const effect = new DamageEffect(0)

      const result = effect.apply(state, makeContext(target), makeServices())

      const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      expect(resultEnemy?.health.current).toBe(50)
      expect(resultEnemy?.block.value).toBe(5)
    })
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — ターゲット異常系 (AC3, 観点10)
// ─────────────────────────────────────────────

describe('DamageEffect.apply - ターゲット異常系（プログラマーバグ）', () => {
  it('context.target が未設定のときエラーを投げる', () => {
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    expect(() => effect.apply(state, makeContext(), makeServices())).toThrow()
  })

  it('context.target.kind が player のときエラーを投げる', () => {
    const enemy = makeEnemy('jaw_worm')
    const target: Target = { kind: 'player' }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    expect(() => effect.apply(state, makeContext(target), makeServices())).toThrow()
  })

  it('context.target.kind が all のときエラーを投げる', () => {
    const enemy = makeEnemy('jaw_worm')
    const target: Target = { kind: 'all' }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    expect(() => effect.apply(state, makeContext(target), makeServices())).toThrow()
  })

  it('target.id が enemies に存在しないとき state をそのまま返す', () => {
    const enemy = makeEnemy('jaw_worm')
    const target: Target = { kind: 'enemy', id: makeEnemyId('unknown_enemy') }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    expect(result.enemies[0]?.health.current).toBe(50)
    expect(result).toStrictEqual(state)
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — イミュータビリティ (観点11)
// ─────────────────────────────────────────────

describe('DamageEffect.apply - イミュータビリティ', () => {
  it('apply は元の BattleState を変更しない', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)
    const originalHp = state.enemies[0]?.health.current

    effect.apply(state, makeContext(target), makeServices())

    expect(state.enemies[0]?.health.current).toBe(originalHp)
  })

  it('apply は元の Enemy オブジェクトを変更せず新しいオブジェクトを返す', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    expect(result.enemies[0]).not.toBe(state.enemies[0])
  })

  it('apply は player を変更しない', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayer()
    const state = makeBattleState([enemy], player)
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    expect(result.player).toBe(state.player)
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — AC2: 筋力バフ/デバフ（Strength）
// ─────────────────────────────────────────────

describe('DamageEffect.apply - AC2: 筋力バフ/デバフ（Strength）', () => {
  it('観点01: プレイヤーが Strength(stacks=3) のとき敵に base+3 ダメージを与える', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Strength, 3, 0)])
    const state = makeBattleState([enemy], player)
    // base=6, +3 strength → damage=9
    const effect = new DamageEffect(6)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(41)
  })

  it('観点01: プレイヤーが Strength(stacks=-2) のとき敵に base-2 ダメージを与える（デバフ）', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Strength, -2, 0)])
    const state = makeBattleState([enemy], player)
    // base=6, -2 strength → damage=4
    const effect = new DamageEffect(6)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(46)
  })

  it('観点28: 同一 Strength 状態で複数回呼んでも同じダメージ（冪等性）', () => {
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Strength, 3, 0)])
    const effect = new DamageEffect(6)

    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const state1 = makeBattleState([enemy1], player)
    const result1 = effect.apply(state1, makeContext(target), makeServices())

    const enemy2 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    const state2 = makeBattleState([enemy2], player)
    const result2 = effect.apply(state2, makeContext(target), makeServices())

    const hp1 = result1.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current
    const hp2 = result2.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current
    expect(hp1).toBe(hp2)
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — AC3: 脆弱（Vulnerable）
// ─────────────────────────────────────────────

describe('DamageEffect.apply - AC3: 脆弱（Vulnerable）', () => {
  it('観点01: 敵が Vulnerable(duration=1) のとき ×1.5 floor ダメージを受ける', () => {
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const state = makeBattleState([enemy])
    // base=10, floor(10 * 1.5) = 15
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(35)
  })

  it('観点01: floor 切り捨てが適用される（5 * 1.5 = 7.5 → 7）', () => {
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)],
    })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(5)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(43)
  })

  it('観点02: 敵が Vulnerable(duration=0) のとき倍率なし（境界値）', () => {
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 0)],
    })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const state = makeBattleState([enemy])
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(40)
  })

  it('観点16: Vulnerable あり vs なし で受けるダメージに差がある', () => {
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const effect = new DamageEffect(10)

    const normalEnemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const normalState = makeBattleState([normalEnemy])
    const normalResult = effect.apply(normalState, makeContext(target), makeServices())

    const vulnerableEnemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    const vulnerableState = makeBattleState([vulnerableEnemy])
    const vulnerableResult = effect.apply(vulnerableState, makeContext(target), makeServices())

    const normalHp = normalResult.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health
      .current
    const vulnerableHp = vulnerableResult.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
      ?.health.current

    expect(vulnerableHp).toBeLessThan(normalHp!)
  })
})

// ─────────────────────────────────────────────
// DamageEffect.apply — AC5: 弱体化（Weak）
// ─────────────────────────────────────────────

describe('DamageEffect.apply - AC5: 弱体化（Weak）', () => {
  it('観点01: プレイヤーが Weak(duration=1) のとき ×0.75 floor ダメージを与える', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Weak, 0, 1)])
    const state = makeBattleState([enemy], player)
    // base=10, floor(10 * 0.75) = 7
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(43)
  })

  it('観点02: プレイヤーが Weak(duration=0) のとき倍率なし（境界値）', () => {
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Weak, 0, 0)])
    const state = makeBattleState([enemy], player)
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(40)
  })

  it('観点16: Weak(attacker) かつ Vulnerable(target) の組み合わせテスト', () => {
    // base=10, weak floor(10*0.75)=7, vulnerable floor(7*1.5)=10
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    const player = makePlayerWithStatusEffects([makeStatusEffect(StatusEffectType.Weak, 0, 1)])
    const state = makeBattleState([enemy], player)
    const effect = new DamageEffect(10)

    const result = effect.apply(state, makeContext(target), makeServices())

    const resultEnemy = result.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(40)
  })
})
