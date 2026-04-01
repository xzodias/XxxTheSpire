import { type EnemyId } from '../../shared/types'
import { type Character } from './Character'

/**
 * インテントタイプ
 *
 * 敵キャラクターが次のターンに実行する行動の種別。
 * - attack: 攻撃（value = ダメージ量）
 * - block: ブロック（value = ブロック量）
 * - buff: バフ（筋力付与等）
 * - debuff: デバフ（脆弱・衰弱付与等）
 * - unknown: 不明（ゲーム開始直後等）
 */
export type IntentType = 'attack' | 'block' | 'buff' | 'debuff' | 'unknown'

/**
 * インテント
 *
 * 敵キャラクターが次のターンに実行する行動の情報。
 * value は行動の種別に応じた数値（ダメージ量・ブロック量等）を表す。
 */
export type Intent = {
  readonly type: IntentType
  readonly value?: number
}

/**
 * 敵エンティティ
 *
 * 敵キャラクター固有の情報（インテント・敵ID）を持つエンティティ。
 * Character インターフェースを実装し、共通の戦闘プロパティ（health/block/powers/statusEffects）を持つ。
 *
 * - powers プロパティは Combatant 経由で保持（Combat には持たせない設計）
 * - intent は次のターンに実行する行動の種別と数値
 * - enemyId は敵の種別識別子（例: 'jaw_worm'）
 *
 * 参照可能な層: domain/value-objects, domain/entities のみ
 */
export interface Enemy extends Character {
  readonly enemyId: EnemyId
  readonly intent: Intent
}
