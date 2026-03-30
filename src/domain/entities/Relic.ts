import { type EnemyId, type RelicId } from '../../shared/types'
import { type Rarity } from '../enums/Rarity'
import { type Card } from './Card'

/**
 * ゲームイベント型
 *
 * レリックがリアクションするゲーム内イベントの種別。
 * on_card_played はプレイされたカード情報を含む。
 * on_enemy_killed は倒した敵の識別子を含む（特定種族対応レリック向け）。
 *
 * ⚠️ 現在は戦闘イベントのみ定義。コンバット外のイベント（on_rest_site 等）は
 * RestSiteActionUseCase（T49）・SelectRewardUseCase（T47）実装時に追加すること。
 * 詳細は各 Issue のコメントを参照。
 */
export type GameEvent =
  | { type: 'on_combat_start' }
  | { type: 'on_turn_start' }
  | { type: 'on_turn_end' }
  | { type: 'on_card_played'; card: Card }
  | { type: 'on_combat_end'; victory: boolean }
  | { type: 'on_enemy_killed'; enemyId: EnemyId }
  | { type: 'on_hp_lost'; amount: number }

/**
 * レリックが要求する最小状態型
 *
 * Combat との循環依存（Combat → Player → Relic → Combat）を回避するため、
 * onTrigger と notifyRelics が共有するジェネリック型変数の境界として定義する。
 * 実際には Combat 型がこの構造を満たす。
 */
export type StateWithPlayer = {
  readonly player: { readonly relics: readonly Relic[] }
}

/**
 * レリックエンティティ（Observer パターン）
 *
 * 各レリックは自分がリアクションするイベント種別を triggers として宣言し、
 * onTrigger で状態変換を返す純粋関数として実装する。
 *
 * onTrigger はジェネリック型を使用することで Combat.ts との循環依存を回避する。
 * （Combat → Player → Relic → Combat の循環を防ぐ）
 *
 * 参照可能な層: domain/enums, domain/entities のみ
 */
export interface Relic {
  readonly id: RelicId
  readonly name: string
  readonly description: string
  readonly rarity: Rarity
  readonly triggers: readonly GameEvent['type'][]
  onTrigger<S extends StateWithPlayer>(event: GameEvent, state: S): S
}

/**
 * レリックトリガーシステム
 *
 * イベント発生時に全レリックへ通知し、状態変換を順次適用する。
 * StateWithPlayer 境界により Combat に依存せず、任意の戦闘状態型で動作する。
 */
export function notifyRelics<S extends StateWithPlayer>(event: GameEvent, state: S): S {
  return state.player.relics.reduce((s, relic) => {
    if (relic.triggers.includes(event.type)) {
      return relic.onTrigger(event, s)
    }
    return s
  }, state)
}
