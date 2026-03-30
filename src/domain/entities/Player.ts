import { type Energy } from '../value-objects/Energy'
import { type Gold } from '../value-objects/Gold'
import { type Card } from './Card'
import { type Character } from './Character'
import { type Potion } from './Potion'
import { type Relic } from './Relic'

/**
 * プレイヤーエンティティ
 *
 * ラン中のプレイヤー全状態を保持するエンティティ。
 * Character インターフェースを実装し、キャラクタークラスの識別子（id/name）と
 * デッキ・手札・捨て札・排除札・レリック・ポーション・ゴールドを持つ。
 *
 * - powers プロパティは Combatant 経由で保持（Combat には持たせない設計）
 * - potions の null は空きスロットを表す
 * - potions.length は必ず maxPotionSlots と等しくなるよう Factory 層で保証すること
 * - id は キャラクタークラス識別子（例: 'ironclad'）として使用する
 *
 * 参照可能な層: domain/entities, domain/value-objects のみ
 */
export interface Player extends Character {
  readonly energy: Energy
  readonly gold: Gold
  readonly deck: readonly Card[]
  readonly hand: readonly Card[]
  readonly discardPile: readonly Card[]
  readonly exhaustPile: readonly Card[]
  readonly relics: readonly Relic[]
  readonly maxPotionSlots: number
  readonly potions: readonly (Potion | null)[]
}
