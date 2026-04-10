import { describe, it, expect, vi } from 'vitest'
import { BlockEffect } from '../../../src/application/effects/BlockEffect'
import {
  type Effect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from '../../../src/application/effects/Effect'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId } from '../../../src/shared/types'
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

function makeEnemy(id: string): Enemy {
  const hp = Health.create(50, 50)
  const block = Block.create(0)
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

function makePlayer(
  overrides?: Partial<{ currentHp: number; maxHp: number; block: number }>,
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

function makeBattleState(player: Player, enemies: readonly Enemy[] = []): BattleState {
  return { player, enemies }
}

function makeContext(): EffectContext {
  return {}
}

// ─────────────────────────────────────────────
// BlockEffect — インターフェース適合
// ─────────────────────────────────────────────

describe('BlockEffect - Effect インターフェース適合', () => {
  it('Effect インターフェースを実装している', () => {
    const effect: Effect = new BlockEffect(5)
    expect(effect).toBeDefined()
  })

  it('正の整数値で構築できる', () => {
    const effect = new BlockEffect(5)
    expect(effect).toBeInstanceOf(BlockEffect)
  })
})

// ─────────────────────────────────────────────
// BlockEffect — 生成・コンストラクタ (AC3, 観点05/07/10)
// ─────────────────────────────────────────────

describe('BlockEffect - 生成', () => {
  it('value=0 で正常に生成できる（境界値：最小正常値）', () => {
    expect(() => new BlockEffect(0)).not.toThrow()
  })

  it('value=1 で正常に生成できる', () => {
    expect(() => new BlockEffect(1)).not.toThrow()
  })

  it('value=999 で正常に生成できる（大きな値）', () => {
    expect(() => new BlockEffect(999)).not.toThrow()
  })

  it('value が負のとき生成時にエラーを投げる（下限違反）', () => {
    expect(() => new BlockEffect(-1)).toThrow()
  })

  it('value が NaN のとき生成時にエラーを投げる', () => {
    expect(() => new BlockEffect(NaN)).toThrow()
  })

  it('value が Infinity のとき生成時にエラーを投げる', () => {
    expect(() => new BlockEffect(Infinity)).toThrow()
  })

  it('value が -Infinity のとき生成時にエラーを投げる', () => {
    expect(() => new BlockEffect(-Infinity)).toThrow()
  })
})

// ─────────────────────────────────────────────
// BlockEffect.apply — 正常系 (AC1, 観点01/02)
// ─────────────────────────────────────────────

describe('BlockEffect.apply - 正常系', () => {
  describe('AC1: プレイヤーにブロックが付与される', () => {
    it('value=5 のときプレイヤーのブロックが 5 増える', () => {
      const player = makePlayer({ block: 0 })
      const state = makeBattleState(player)
      const effect = new BlockEffect(5)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.player.block.value).toBe(5)
    })

    it('既存のブロックに加算される', () => {
      const player = makePlayer({ block: 3 })
      const state = makeBattleState(player)
      const effect = new BlockEffect(5)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.player.block.value).toBe(8)
    })

    it('value=0 のとき既存ブロックは変わらない（境界値）', () => {
      const player = makePlayer({ block: 5 })
      const state = makeBattleState(player)
      const effect = new BlockEffect(0)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.player.block.value).toBe(5)
    })

    it('value=1 のとき既存ブロックに 1 加算（最小加算）', () => {
      const player = makePlayer({ block: 0 })
      const state = makeBattleState(player)
      const effect = new BlockEffect(1)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.player.block.value).toBe(1)
    })
  })

  describe('AC1: 敵に影響を与えない', () => {
    it('BlockEffect は enemies を変更しない', () => {
      const player = makePlayer()
      const enemy = makeEnemy('jaw_worm')
      const state = makeBattleState(player, [enemy])
      const effect = new BlockEffect(5)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.enemies).toBe(state.enemies)
    })
  })
})

// ─────────────────────────────────────────────
// BlockEffect.apply — イミュータビリティ (観点11)
// ─────────────────────────────────────────────

describe('BlockEffect.apply - イミュータビリティ', () => {
  it('apply は元の BattleState を変更しない', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)
    const effect = new BlockEffect(5)
    const originalBlockValue = state.player.block.value

    effect.apply(state, makeContext(), makeServices())

    expect(state.player.block.value).toBe(originalBlockValue)
  })

  it('apply は元の player オブジェクトを変更せず新しいオブジェクトを返す', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)
    const effect = new BlockEffect(5)

    const result = effect.apply(state, makeContext(), makeServices())

    expect(result.player).not.toBe(state.player)
  })

  it('apply は元の player.block オブジェクトを変更しない', () => {
    const player = makePlayer({ block: 3 })
    const originalBlock = player.block
    const state = makeBattleState(player)
    const effect = new BlockEffect(5)

    effect.apply(state, makeContext(), makeServices())

    expect(originalBlock.value).toBe(3)
  })
})

// ─────────────────────────────────────────────
// BlockEffect.apply — BattleState への反映 (AC5)
// ─────────────────────────────────────────────

describe('BlockEffect.apply - BattleState への反映', () => {
  it('apply の戻り値に更新後の player が含まれる', () => {
    const player = makePlayer({ block: 0 })
    const state = makeBattleState(player)
    const effect = new BlockEffect(7)

    const result = effect.apply(state, makeContext(), makeServices())

    expect(result.player.block.value).toBe(7)
    expect(result.player).not.toBe(player)
  })

  it('apply の戻り値は新しい BattleState オブジェクト', () => {
    const player = makePlayer()
    const state = makeBattleState(player)
    const effect = new BlockEffect(5)

    const result = effect.apply(state, makeContext(), makeServices())

    expect(result).not.toBe(state)
  })
})
