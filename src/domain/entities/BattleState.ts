import { type Player } from './Player'
import { type Enemy } from './Enemy'

/**
 * エフェクト適用対象の戦闘状態（ドメイン層）
 *
 * エフェクトが読み取り・更新する戦闘状態のスナップショット。
 * Player・Enemy の現在状態を保持する不変オブジェクト。
 *
 * - target（カードプレイ時の一時ターゲット）は含まない
 *   → EffectContext として別途渡す（application 層の責務）
 * - turn・phase 等の戦闘進行情報は将来必要に応じて拡張する
 *
 * 参照可能な層: domain, application
 * 参照してはいけない層: infrastructure, presentation
 */
export interface BattleState {
  readonly player: Player
  readonly enemies: readonly Enemy[]
}
