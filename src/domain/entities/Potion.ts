import { type PotionId } from '../../shared/types'
import { type Rarity } from '../enums/Rarity'
import { type TargetType } from '../enums/TargetType'

/**
 * ポーションエンティティ
 *
 * ポーションの静的定義（マスターデータとして持つべき情報）。
 * 使用時の効果はアプリケーション層で処理する。
 *
 * 参照可能な層: domain/enums, shared/types のみ
 */
export interface Potion {
  readonly id: PotionId
  readonly name: string
  readonly description: string
  readonly rarity: Rarity
  readonly targetType: TargetType
}
