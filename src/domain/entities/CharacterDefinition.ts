import { type CardId, type CharacterId, type RelicId } from '../../shared/types'

/**
 * スターターデッキエントリ
 *
 * キャラクターの初期デッキにおけるカードIDと枚数のペア。
 */
export type StarterDeckEntry = {
  readonly id: CardId
  readonly count: number
}

/**
 * キャラクター定義
 *
 * キャラクタークラス（Ironclad・Silent等）の静的マスターデータ。
 * ラン開始時のプレイヤー初期状態を構築するために使用する。
 *
 * 参照可能な層: shared/types のみ（domain ロジック依存ゼロ）
 */
export type CharacterDefinition = {
  readonly id: CharacterId
  readonly name: string
  readonly startingHp: number
  readonly maxEnergy: number
  readonly startingDeck: ReadonlyArray<StarterDeckEntry>
  readonly startingRelicId: RelicId
}
