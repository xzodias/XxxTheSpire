import { type CardId, type EffectDef } from '../../shared/types'
import { type CardType } from '../enums/CardType'
import { type Rarity } from '../enums/Rarity'
import { type TargetType } from '../enums/TargetType'

/**
 * カードエンティティ
 *
 * カードの静的定義（マスターデータとして持つべき情報）。
 * プレイ中の状態（手札・デッキ内の位置等）は含まない。
 *
 * 参照可能な層: domain/enums, shared/types のみ
 */
export interface Card {
  readonly id: CardId
  readonly name: string
  readonly description: string
  readonly cost: number
  readonly type: CardType
  readonly rarity: Rarity
  readonly targetType: TargetType
  readonly effects: readonly EffectDef[]
  readonly upgraded: boolean
}
