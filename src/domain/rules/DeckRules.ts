import { type Player } from '../entities/Player'
import { type Card } from '../entities/Card'
import { type IRandomService } from '../interfaces/IRandomService'
import { type CardId, type Result, ok, err } from '../../shared/types'
import { MAX_HAND_SIZE } from '../../shared/constants'

/**
 * ドロー結果
 *
 * drawn: 手札に加わったカード
 * burned: 手札満杯のため捨て札に送られたカード（バーン）
 */
export type DrawResult = {
  readonly player: Player
  readonly drawn: readonly Card[]
  readonly burned: readonly Card[]
}

/**
 * 山札から count 枚ドローする（純粋関数）。
 *
 * - 山札が空になった場合、捨て札をシャッフルして山札に補充してからドローを継続する。
 * - 手札が MAX_HAND_SIZE(10) に達した場合、超過するカードは捨て札にバーンされる。
 * - 山札・捨て札ともに空のとき、要求枚数に満たなくてもエラーにならない。
 *
 * @param count - ドロー枚数（非負整数）
 * @throws {RangeError} count が負数または非整数の場合
 *
 * 参照可能な層: domain/entities, domain/interfaces のみ（純粋関数）
 */
export function drawCards(player: Player, count: number, random: IRandomService): DrawResult {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`drawCards: count must be a non-negative integer, got ${count}`)
  }

  let currentPlayer = player
  const drawn: Card[] = []
  const burned: Card[] = []

  for (let i = 0; i < count; i++) {
    if (currentPlayer.deck.length === 0) {
      if (currentPlayer.discardPile.length === 0) {
        break
      }
      const newDeck = random.shuffle(currentPlayer.discardPile)
      currentPlayer = { ...currentPlayer, deck: newDeck, discardPile: [] }
    }

    const topCard = currentPlayer.deck[0]!
    const remainingDeck = currentPlayer.deck.slice(1)

    if (currentPlayer.hand.length >= MAX_HAND_SIZE) {
      burned.push(topCard)
      currentPlayer = {
        ...currentPlayer,
        deck: remainingDeck,
        discardPile: [...currentPlayer.discardPile, topCard],
      }
    } else {
      drawn.push(topCard)
      currentPlayer = {
        ...currentPlayer,
        deck: remainingDeck,
        hand: [...currentPlayer.hand, topCard],
      }
    }
  }

  return { player: currentPlayer, drawn, burned }
}

/**
 * 手札の指定カードを捨て札に移す（純粋関数）。
 *
 * @returns 成功時: 更新後の Player / 失敗時: 'not_in_hand'
 */
export function discardCard(player: Player, cardId: CardId): Result<Player, 'not_in_hand'> {
  const cardIndex = player.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) {
    return err('not_in_hand')
  }
  const card = player.hand[cardIndex]!
  return ok({
    ...player,
    hand: player.hand.filter((_, i) => i !== cardIndex),
    discardPile: [...player.discardPile, card],
  })
}

/**
 * 手札の指定カードを消耗させる（exhaustPile へ移動）（純粋関数）。
 * 消耗カードはデッキに戻らない。
 *
 * @returns 成功時: 更新後の Player / 失敗時: 'not_in_hand'
 */
export function exhaustCard(player: Player, cardId: CardId): Result<Player, 'not_in_hand'> {
  const cardIndex = player.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) {
    return err('not_in_hand')
  }
  const card = player.hand[cardIndex]!
  return ok({
    ...player,
    hand: player.hand.filter((_, i) => i !== cardIndex),
    exhaustPile: [...player.exhaustPile, card],
  })
}

/**
 * 山札をシャッフルした新しい Player を返す（純粋関数）。
 */
export function shuffleDeck(player: Player, random: IRandomService): Player {
  return {
    ...player,
    deck: random.shuffle(player.deck),
  }
}
