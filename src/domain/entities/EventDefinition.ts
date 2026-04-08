import { type CardId, type EventId, type RelicId } from '../../shared/types'

/**
 * イベントアウトカム（discriminated union）
 *
 * イベント選択肢を選んだ際の結果。kind によって必須フィールドが異なる。
 * - 数値効果（gain_hp / lose_hp / gain_gold / lose_gold）: value 必須
 * - カード操作（add_card）: cardId 必須
 * - カード除去（remove_card）: cardId 任意（省略時はプレイヤーが選択）
 * - レリック取得（gain_relic）: relicId 必須
 * - 何もなし（nothing）: 追加フィールドなし
 */
export type EventOutcome =
  | { readonly kind: 'gain_hp'; readonly value: number }
  | { readonly kind: 'lose_hp'; readonly value: number }
  | { readonly kind: 'gain_gold'; readonly value: number }
  | { readonly kind: 'lose_gold'; readonly value: number }
  | { readonly kind: 'add_card'; readonly cardId: CardId }
  | { readonly kind: 'remove_card'; readonly cardId?: CardId }
  | { readonly kind: 'gain_relic'; readonly relicId: RelicId }
  | { readonly kind: 'nothing' }

/**
 * イベント選択肢
 *
 * イベント画面でプレイヤーが選べる選択肢と、選んだ際の結果の一覧。
 * outcomes は全件・宣言順に適用される。
 */
export type EventChoice = {
  readonly text: string
  /** 選択時に全件・宣言順に適用されるアウトカムのリスト */
  readonly outcomes: ReadonlyArray<EventOutcome>
}

/**
 * イベント定義
 *
 * マップ上のイベントノードで発生するイベントのマスターデータ。
 * 参照可能な層: shared/types のみ（domain ロジック依存ゼロ）
 */
export type EventDefinition = {
  readonly id: EventId
  readonly name: string
  readonly description: string
  readonly choices: ReadonlyArray<EventChoice>
}
