import { describe, it, expect, vi } from 'vitest'
import { DrawEffect } from '../../../src/application/effects/DrawEffect'
import {
  type Effect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from '../../../src/application/effects/Effect'
import { type Player } from '../../../src/domain/entities/Player'
import { type Card } from '../../../src/domain/entities/Card'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { CardType } from '../../../src/domain/enums/CardType'
import { Rarity } from '../../../src/domain/enums/Rarity'
import { TargetType } from '../../../src/domain/enums/TargetType'
import { type CardId } from '../../../src/shared/types'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Health } from '../../../src/domain/value-objects/Health'
import { Gold } from '../../../src/domain/value-objects/Gold'
import { Block } from '../../../src/domain/value-objects/Block'
import { MAX_HAND_SIZE } from '../../../src/shared/constants'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeCardId(id: string): CardId {
  return id as CardId
}

function makeCard(id: string): Card {
  return {
    id: makeCardId(id),
    name: id,
    description: `${id} description`,
    cost: 1,
    type: CardType.Attack,
    rarity: Rarity.Common,
    targetType: TargetType.Single,
    effects: [],
    upgraded: false,
  }
}

function makeCards(count: number, prefix = 'card'): Card[] {
  return Array.from({ length: count }, (_, i) => makeCard(`${prefix}_${i}`))
}

function makePlayer(
  overrides: Partial<{
    deck: readonly Card[]
    hand: readonly Card[]
    discardPile: readonly Card[]
    exhaustPile: readonly Card[]
  }>,
): Player {
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
    deck: overrides.deck ?? [],
    hand: overrides.hand ?? [],
    discardPile: overrides.discardPile ?? [],
    exhaustPile: overrides.exhaustPile ?? [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: [],
    statusEffects: [],
  }
}

function makeServices(overrides?: Partial<IRandomService>): EffectServices {
  return {
    random: {
      next: vi.fn(() => 0),
      nextInt: vi.fn((min: number) => min),
      shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [
        ...array,
      ]) as IRandomService['shuffle'],
      ...overrides,
    },
  }
}

function makeBattleState(player: Player, overrides?: Partial<BattleState>): BattleState {
  return { player, enemies: [], ...overrides }
}

function makeContext(): EffectContext {
  return {}
}

// ─────────────────────────────────────────────
// DrawEffect — 型確認
// ─────────────────────────────────────────────

describe('DrawEffect - Effect インターフェース適合', () => {
  it('Effect インターフェースを実装している', () => {
    const effect: Effect = new DrawEffect(1)
    expect(effect).toBeDefined()
  })

  it('count が正の整数で構築できる', () => {
    const effect = new DrawEffect(3)
    expect(effect).toBeInstanceOf(DrawEffect)
  })
})

// ─────────────────────────────────────────────
// DrawEffect.apply — AC5: ドローエフェクトを持つカードをプレイ
// ─────────────────────────────────────────────

describe('DrawEffect.apply', () => {
  describe('AC5: ドローエフェクトで規定枚数のカードが手札に加わる', () => {
    it('count=2 のとき手札が 2 枚増える', () => {
      const player = makePlayer({ deck: makeCards(10) })
      const effect = new DrawEffect(2)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(2)
    })

    it('count=1 のとき手札が 1 枚増える（境界値：最小）', () => {
      const player = makePlayer({ deck: makeCards(5) })
      const effect = new DrawEffect(1)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(1)
    })

    it('count=5 のとき手札が 5 枚増える', () => {
      const player = makePlayer({ deck: makeCards(10) })
      const effect = new DrawEffect(5)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(5)
    })

    it('ドロー後に山札の枚数が減る', () => {
      const player = makePlayer({ deck: makeCards(10) })
      const effect = new DrawEffect(3)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.deck).toHaveLength(7)
    })
  })

  describe('AC2: 山札が空のとき捨て札からリシャッフルしてドロー', () => {
    it('山札が空で捨て札がある場合はリシャッフルしてドローする', () => {
      const player = makePlayer({ deck: [], discardPile: makeCards(8, 'discard') })
      const shuffleMock = vi.fn(<T>(arr: readonly T[]): readonly T[] => [
        ...arr,
      ]) as IRandomService['shuffle']
      const effect = new DrawEffect(3)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices({ shuffle: shuffleMock }))

      expect(result.player.hand).toHaveLength(3)
      expect(shuffleMock).toHaveBeenCalledOnce()
    })
  })

  describe('AC6: 手札が MAX_HAND_SIZE(10) のとき超過分はバーンされる', () => {
    it('手札が満杯（10枚）のとき draw しようとしてもバーンされ手札は増えない', () => {
      const player = makePlayer({
        deck: makeCards(5, 'deck'),
        hand: makeCards(MAX_HAND_SIZE, 'hand'),
      })
      const effect = new DrawEffect(2)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
    })

    it('手札が 9 枚で 3 枚 draw すると 1 枚ドロー・2 枚バーン', () => {
      const player = makePlayer({ deck: makeCards(5, 'deck'), hand: makeCards(9, 'hand') })
      const effect = new DrawEffect(3)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
    })
  })

  describe('AC4: デッキ操作の結果が BattleState に反映される', () => {
    it('apply の戻り値に更新後の player が含まれる', () => {
      const player = makePlayer({ deck: makeCards(5) })
      const effect = new DrawEffect(2)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player).not.toBe(player)
      expect(result.player.hand).toHaveLength(2)
    })

    it('apply は enemies を変更しない（DrawEffect はプレイヤーのみ変更）', () => {
      const player = makePlayer({ deck: makeCards(5) })
      const state = makeBattleState(player)
      const effect = new DrawEffect(2)

      const result = effect.apply(state, makeContext(), makeServices())

      expect(result.enemies).toBe(state.enemies)
    })
  })

  describe('イミュータビリティ', () => {
    it('apply は元の player を変更しない', () => {
      const player = makePlayer({ deck: makeCards(10) })
      const originalDeckLength = player.deck.length
      const originalHandLength = player.hand.length
      const effect = new DrawEffect(3)

      effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(player.deck).toHaveLength(originalDeckLength)
      expect(player.hand).toHaveLength(originalHandLength)
    })
  })

  describe('異常系 - 不正な count', () => {
    it('count=0 で apply すると手札が増えない', () => {
      const player = makePlayer({ deck: makeCards(5) })
      const effect = new DrawEffect(0)

      const result = effect.apply(makeBattleState(player), makeContext(), makeServices())

      expect(result.player.hand).toHaveLength(0)
    })

    it('山札も捨て札も空のとき apply してもエラーにならない', () => {
      const player = makePlayer({ deck: [], discardPile: [] })
      const effect = new DrawEffect(3)

      expect(() => effect.apply(makeBattleState(player), makeContext(), makeServices())).not.toThrow()
    })
  })
})

// ─────────────────────────────────────────────
// DrawEffect — Factoryパターン観点
// ─────────────────────────────────────────────

describe('DrawEffect - Factory / 生成', () => {
  it('count=1 で正常に生成できる（最小正常値）', () => {
    expect(() => new DrawEffect(1)).not.toThrow()
  })

  it('count=MAX_HAND_SIZE で正常に生成できる（最大正常値）', () => {
    expect(() => new DrawEffect(MAX_HAND_SIZE)).not.toThrow()
  })

  it('count が負のとき生成時にエラーを投げる', () => {
    expect(() => new DrawEffect(-1)).toThrow()
  })

  it('count が非整数（小数）のとき生成時にエラーを投げる', () => {
    expect(() => new DrawEffect(1.5)).toThrow()
  })
})
