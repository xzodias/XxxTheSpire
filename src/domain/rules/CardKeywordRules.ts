import { type Player } from '../entities/Player'
import { type CardId, type Result, ok, err } from '../../shared/types'
import { CardKeyword } from '../enums/CardKeyword'

/**
 * カードをプレイした後の行き先を keywords で決定する（純粋関数）。
 *
 * - Exhaust キーワードあり → exhaustPile へ移動
 * - キーワードなし（またはその他）→ discardPile へ移動
 *
 * @returns 成功時: 更新後の Player / 失敗時: 'not_in_hand'
 *
 * 参照可能な層: domain/entities, domain/enums, shared/types のみ（純粋関数）
 */
export function playCard(player: Player, cardId: CardId): Result<Player, 'not_in_hand'> {
  const cardIndex = player.hand.findIndex((c) => c.id === cardId)
  if (cardIndex === -1) {
    return err('not_in_hand')
  }
  const card = player.hand[cardIndex]!
  const newHand = player.hand.filter((_, i) => i !== cardIndex)
  const keywords = card.keywords

  if (keywords.includes(CardKeyword.Exhaust)) {
    return ok({
      ...player,
      hand: newHand,
      exhaustPile: [...player.exhaustPile, card],
    })
  }

  return ok({
    ...player,
    hand: newHand,
    discardPile: [...player.discardPile, card],
  })
}

/**
 * ターン終了時にキーワードに応じた手札処理を行う（純粋関数）。
 *
 * - Ethereal キーワードあり → exhaustPile へ移動（Retain より優先）
 * - Retain キーワードあり（Ethereal なし）→ 手札に残す
 * - それ以外 → 手札から除去する（捨て札への移動は別の処理が担う）
 *
 * 参照可能な層: domain/entities, domain/enums, shared/types のみ（純粋関数）
 */
export function applyEndOfTurnKeywords(player: Player): Player {
  const retainedHand = player.hand.filter((card) => {
    const keywords = card.keywords
    return !keywords.includes(CardKeyword.Ethereal) && keywords.includes(CardKeyword.Retain)
  })

  const etherealCards = player.hand.filter((card) => {
    const keywords = card.keywords
    return keywords.includes(CardKeyword.Ethereal)
  })

  return {
    ...player,
    hand: retainedHand,
    exhaustPile: [...player.exhaustPile, ...etherealCards],
  }
}
