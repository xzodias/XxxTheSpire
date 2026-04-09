import { describe, it, expect, vi } from 'vitest'
import {
  drawCards,
  discardCard,
  exhaustCard,
  shuffleDeck,
} from '../../../src/domain/rules/DeckRules'
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
import { MAX_HAND_SIZE, STARTING_DRAW_COUNT } from '../../../src/shared/constants'

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

/**
 * IRandomService モック。
 * shuffle はデフォルトで配列をそのまま返す（決定論的）。
 * 必要に応じて vi.fn() で上書き可能。
 */
function makeRandomService(overrides?: Partial<IRandomService>): IRandomService {
  return {
    next: vi.fn(() => 0),
    nextInt: vi.fn((min: number) => min),
    shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [
      ...array,
    ]) as IRandomService['shuffle'],
    ...overrides,
  }
}

// ─────────────────────────────────────────────
// drawCards
// ─────────────────────────────────────────────

describe('drawCards', () => {
  describe('正常系 - 基本ドロー', () => {
    it('AC1: ターン開始時に STARTING_DRAW_COUNT(5) 枚ドローできる', () => {
      const deck = makeCards(10)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, STARTING_DRAW_COUNT, random)

      expect(result.drawn).toHaveLength(STARTING_DRAW_COUNT)
      expect(result.player.hand).toHaveLength(STARTING_DRAW_COUNT)
    })

    it('ドローしたカードは山札から除去される', () => {
      const deck = makeCards(10)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, STARTING_DRAW_COUNT, random)

      expect(result.player.deck).toHaveLength(10 - STARTING_DRAW_COUNT)
    })

    it('ドローしたカードは手札の先頭から追加される（既存手札との結合）', () => {
      const existingHand = makeCards(2, 'hand')
      const deck = makeCards(5, 'deck')
      const player = makePlayer({ deck, hand: existingHand })
      const random = makeRandomService()

      const result = drawCards(player, 3, random)

      expect(result.player.hand).toHaveLength(5)
    })

    it('1枚だけドローできる（境界値：最小正常値）', () => {
      const deck = makeCards(5)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, 1, random)

      expect(result.drawn).toHaveLength(1)
      expect(result.player.hand).toHaveLength(1)
    })

    it('山札と同数のカードをドローできる（境界値：ちょうど枚数）', () => {
      const deck = makeCards(5)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, 5, random)

      expect(result.drawn).toHaveLength(5)
      expect(result.player.deck).toHaveLength(0)
    })
  })

  describe('AC2: 山札が空になったとき捨て札をシャッフルして山札に戻す', () => {
    it('山札が空で捨て札がある場合、捨て札がシャッフルされ山札になってからドローする', () => {
      const discardPile = makeCards(8, 'discard')
      const player = makePlayer({ deck: [], discardPile })
      const shuffled = [...discardPile].reverse()
      const random = makeRandomService({
        shuffle: vi.fn(() => shuffled) as IRandomService['shuffle'],
      })

      const result = drawCards(player, STARTING_DRAW_COUNT, random)

      expect(random.shuffle).toHaveBeenCalledOnce()
      expect(result.drawn).toHaveLength(STARTING_DRAW_COUNT)
      expect(result.player.discardPile).toHaveLength(0)
    })

    it('山札が途中で空になった場合、残りを捨て札からシャッフルして補充しドローする', () => {
      const deck = makeCards(2, 'deck')
      const discardPile = makeCards(6, 'discard')
      const player = makePlayer({ deck, discardPile })
      const random = makeRandomService({
        shuffle: vi.fn(<T>(arr: readonly T[]): readonly T[] => [
          ...arr,
        ]) as IRandomService['shuffle'],
      })

      const result = drawCards(player, STARTING_DRAW_COUNT, random)

      expect(result.drawn).toHaveLength(STARTING_DRAW_COUNT)
    })

    it('山札も捨て札も空の場合、ドロー枚数が不足してもエラーにならない', () => {
      const player = makePlayer({ deck: [], discardPile: [] })
      const random = makeRandomService()

      const result = drawCards(player, STARTING_DRAW_COUNT, random)

      expect(result.drawn.length).toBeLessThan(STARTING_DRAW_COUNT)
      expect(result.player.hand.length).toBe(result.drawn.length)
    })

    it('シャッフル後の捨て札は空になる', () => {
      const discardPile = makeCards(5, 'discard')
      const player = makePlayer({ deck: [], discardPile })
      const random = makeRandomService()

      const result = drawCards(player, 3, random)

      expect(result.player.discardPile).toHaveLength(0)
    })
  })

  describe('AC6: 手札が MAX_HAND_SIZE(10) の場合、超過分はバーンされる', () => {
    it('手札が MAX_HAND_SIZE のとき追加ドローしようとするとすべてバーンされる', () => {
      const hand = makeCards(MAX_HAND_SIZE, 'hand')
      const deck = makeCards(5, 'deck')
      const player = makePlayer({ deck, hand })
      const random = makeRandomService()

      const result = drawCards(player, 3, random)

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
      expect(result.burned).toHaveLength(3)
    })

    it('手札が 9 枚で 3 枚ドローしようとすると 1 枚ドロー・2 枚バーン', () => {
      const hand = makeCards(9, 'hand')
      const deck = makeCards(5, 'deck')
      const player = makePlayer({ deck, hand })
      const random = makeRandomService()

      const result = drawCards(player, 3, random)

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
      expect(result.drawn).toHaveLength(1)
      expect(result.burned).toHaveLength(2)
    })

    it('手札が 0 枚で MAX_HAND_SIZE 枚ドローするとちょうど満杯になる（境界値：最大正常値）', () => {
      const deck = makeCards(MAX_HAND_SIZE + 2)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, MAX_HAND_SIZE, random)

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
      expect(result.burned).toHaveLength(0)
    })

    it('手札が 0 枚で MAX_HAND_SIZE+1 枚ドローしようとすると 1 枚バーンされる', () => {
      const deck = makeCards(MAX_HAND_SIZE + 2)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = drawCards(player, MAX_HAND_SIZE + 1, random)

      expect(result.player.hand).toHaveLength(MAX_HAND_SIZE)
      expect(result.burned).toHaveLength(1)
    })
  })

  describe('イミュータビリティ', () => {
    it('元の player オブジェクトを変更しない', () => {
      const deck = makeCards(10)
      const player = makePlayer({ deck })
      const originalDeckLength = player.deck.length
      const random = makeRandomService()

      drawCards(player, STARTING_DRAW_COUNT, random)

      expect(player.deck).toHaveLength(originalDeckLength)
      expect(player.hand).toHaveLength(0)
    })

    it('元の deck 配列を変更しない', () => {
      const deck = makeCards(10)
      const originalDeck = [...deck]
      const player = makePlayer({ deck })
      const random = makeRandomService()

      drawCards(player, STARTING_DRAW_COUNT, random)

      expect(player.deck).toEqual(originalDeck)
    })
  })
})

// ─────────────────────────────────────────────
// discardCard
// ─────────────────────────────────────────────

describe('discardCard', () => {
  describe('正常系', () => {
    it('手札のカードを捨て札に移せる', () => {
      const card = makeCard('strike')
      const hand = [card, makeCard('defend')]
      const player = makePlayer({ hand })

      const result = discardCard(player, makeCardId('strike'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(1)
      expect(result.value.discardPile).toHaveLength(1)
      expect(result.value.discardPile[0]!.id).toBe(makeCardId('strike'))
    })

    it('捨て札に移動したカードは手札に残らない', () => {
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      const result = discardCard(player, makeCardId('strike'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(0)
    })

    it('手札が 1 枚のとき捨て札に移すと手札が空になる（境界値：最小）', () => {
      const card = makeCard('last_card')
      const player = makePlayer({ hand: [card] })

      const result = discardCard(player, makeCardId('last_card'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(0)
      expect(result.value.discardPile).toHaveLength(1)
    })

    it('既存の捨て札に追加される（既存捨て札との結合）', () => {
      const existingDiscard = makeCards(3, 'old')
      const card = makeCard('new_card')
      const player = makePlayer({ hand: [card], discardPile: existingDiscard })

      const result = discardCard(player, makeCardId('new_card'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.discardPile).toHaveLength(4)
    })
  })

  describe('異常系 - 存在しないカード参照', () => {
    it('手札にないカードIDを指定すると not_in_hand エラーを返す', () => {
      const player = makePlayer({ hand: makeCards(3) })

      const result = discardCard(player, makeCardId('nonexistent_card'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })

    it('手札が空のとき discardCard を呼ぶと not_in_hand エラーを返す', () => {
      const player = makePlayer({ hand: [] })

      const result = discardCard(player, makeCardId('any_card'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })
  })

  describe('イミュータビリティ', () => {
    it('元の player オブジェクトを変更しない', () => {
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      discardCard(player, makeCardId('strike'))

      expect(player.hand).toHaveLength(1)
      expect(player.discardPile).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────
// exhaustCard
// ─────────────────────────────────────────────

describe('exhaustCard', () => {
  describe('AC3: 消耗カードがプレイ後に除外されデッキに戻らない', () => {
    it('手札のカードを exhaustPile に移せる', () => {
      const card = makeCard('exhaust_me')
      const player = makePlayer({ hand: [card] })

      const result = exhaustCard(player, makeCardId('exhaust_me'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exhaustPile).toHaveLength(1)
      expect(result.value.exhaustPile[0]!.id).toBe(makeCardId('exhaust_me'))
    })

    it('消耗したカードは手札から除去される', () => {
      const card = makeCard('exhaust_me')
      const player = makePlayer({ hand: [card] })

      const result = exhaustCard(player, makeCardId('exhaust_me'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(0)
    })

    it('消耗したカードは捨て札に移動しない', () => {
      const card = makeCard('exhaust_me')
      const player = makePlayer({ hand: [card] })

      const result = exhaustCard(player, makeCardId('exhaust_me'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.discardPile).toHaveLength(0)
    })

    it('消耗したカードは山札に戻らない', () => {
      const card = makeCard('exhaust_me')
      const player = makePlayer({ hand: [card], deck: makeCards(3, 'deck') })

      const result = exhaustCard(player, makeCardId('exhaust_me'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.deck).toHaveLength(3)
    })

    it('既存の exhaustPile に追加される', () => {
      const existingExhaust = makeCards(2, 'exhausted')
      const card = makeCard('new_exhaust')
      const player = makePlayer({ hand: [card], exhaustPile: existingExhaust })

      const result = exhaustCard(player, makeCardId('new_exhaust'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exhaustPile).toHaveLength(3)
    })
  })

  describe('異常系 - 存在しないカード参照', () => {
    it('手札にないカードIDを指定すると not_in_hand エラーを返す', () => {
      const player = makePlayer({ hand: makeCards(3) })

      const result = exhaustCard(player, makeCardId('ghost_card'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })

    it('手札が空のとき exhaustCard を呼ぶと not_in_hand エラーを返す', () => {
      const player = makePlayer({ hand: [] })

      const result = exhaustCard(player, makeCardId('any_card'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })
  })

  describe('イミュータビリティ', () => {
    it('元の player オブジェクトを変更しない', () => {
      const card = makeCard('exhaust_me')
      const player = makePlayer({ hand: [card] })

      exhaustCard(player, makeCardId('exhaust_me'))

      expect(player.hand).toHaveLength(1)
      expect(player.exhaustPile).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────
// shuffleDeck
// ─────────────────────────────────────────────

describe('shuffleDeck', () => {
  describe('正常系', () => {
    it('シャッフルされた新しい山札を持つ Player を返す', () => {
      const deck = makeCards(5)
      const player = makePlayer({ deck })
      const shuffled = [...deck].reverse()
      const random = makeRandomService({
        shuffle: vi.fn(() => shuffled) as IRandomService['shuffle'],
      })

      const result = shuffleDeck(player, random)

      expect(result.deck).toEqual(shuffled)
    })

    it('IRandomService.shuffle が 1 回呼ばれる', () => {
      const deck = makeCards(5)
      const player = makePlayer({ deck })
      const random = makeRandomService()

      shuffleDeck(player, random)

      expect(random.shuffle).toHaveBeenCalledOnce()
      expect(random.shuffle).toHaveBeenCalledWith(deck)
    })

    it('空の山札に対してシャッフルしてもエラーにならない', () => {
      const player = makePlayer({ deck: [] })
      const random = makeRandomService()

      const result = shuffleDeck(player, random)

      expect(result.deck).toHaveLength(0)
    })

    it('1枚だけの山札をシャッフルできる（境界値：最小）', () => {
      const deck = [makeCard('single_card')]
      const player = makePlayer({ deck })
      const random = makeRandomService()

      const result = shuffleDeck(player, random)

      expect(result.deck).toHaveLength(1)
    })
  })

  describe('イミュータビリティ', () => {
    it('元の player オブジェクトを変更しない', () => {
      const deck = makeCards(5)
      const player = makePlayer({ deck })
      const original = [...deck]
      const random = makeRandomService({
        shuffle: vi.fn(
          <T>(arr: readonly T[]): readonly T[] => [...arr].reverse() as readonly T[],
        ) as IRandomService['shuffle'],
      })

      shuffleDeck(player, random)

      expect(player.deck).toEqual(original)
    })

    it('他のフィールド（手札・捨て札等）は変更されない', () => {
      const hand = makeCards(3, 'hand')
      const discardPile = makeCards(2, 'discard')
      const player = makePlayer({ deck: makeCards(5), hand, discardPile })
      const random = makeRandomService()

      const result = shuffleDeck(player, random)

      expect(result.hand).toEqual(hand)
      expect(result.discardPile).toEqual(discardPile)
    })
  })
})
