import { type PowerId } from '../../shared/types'
import { type GameEvent } from './Relic'
import { type Health } from '../value-objects/Health'
import { type Block } from '../value-objects/Block'
import { type StatusEffect } from './StatusEffect'

/**
 * Power が操作する戦闘者の最小構造
 *
 * BattleState（Player/Enemy）との循環依存を回避するため、
 * Power が必要とするフィールドのみを定義する最小型。
 * BattleState は構造的に BattleStateForPower を満たす。
 */
export type CombatantForPower = {
  readonly health: Health
  readonly block: Block
  readonly powers: readonly Power[]
  readonly statusEffects: readonly StatusEffect[]
}

/**
 * Power が受け取る戦闘状態の最小構造
 *
 * Player/Enemy の追加フィールド（energy, deck 等）は Power の処理には不要のため含まない。
 * useBattleViewModel では BattleState をそのまま渡せる（構造的部分型）。
 */
export type BattleStateForPower = {
  readonly player: CombatantForPower
  readonly enemies: readonly (CombatantForPower & { readonly id: string })[]
}

/**
 * Power トリガー時のオーナー情報
 *
 * Power がプレイヤーに付与されているか、特定の敵に付与されているかを区別する。
 */
export type PowerOwner =
  | { readonly kind: 'player' }
  | { readonly kind: 'enemy'; readonly id: string }

/**
 * Power エンティティ（Observer パターン）
 *
 * バフ・デバフを問わず、ゲームイベント（ターン開始・終了等）をトリガーとして
 * 自律的に処理を実行する効果の基底インターフェース。
 *
 * Relic と同様の Observer パターンで実装する。Relic との違い:
 * - Relic はプレイヤーのみが保有し、ランを通じて永続する
 * - Power はプレイヤーおよび敵の両方が保有し、戦闘中のみ有効
 *
 * onTrigger はジェネリック型を使用することで BattleState との循環依存を回避する。
 * （BattleState → Player → Combatant → Power → BattleState の循環を防ぐ）
 *
 * 参照可能な層: domain/entities, domain/value-objects のみ
 */
export interface Power {
  readonly id: PowerId
  readonly name: string
  readonly stacks: number
  readonly triggers: readonly GameEvent['type'][]
  onTrigger<S extends BattleStateForPower>(event: GameEvent, owner: PowerOwner, state: S): S
}

/**
 * プレイヤーの Powers にイベントを通知し、状態変換を順次適用する（純粋関数）。
 *
 * triggers に event.type が含まれる Power のみ実行される。
 * 実行順序は powers 配列の順（付与された順）に従う。
 *
 * @param event - 発生したゲームイベント
 * @param state - 現在の戦闘状態（BattleState を渡せる）
 * @returns 更新後の戦闘状態
 */
export function notifyPlayerPowers<S extends BattleStateForPower>(event: GameEvent, state: S): S {
  let current: S = state
  for (const power of state.player.powers) {
    if (power.triggers.includes(event.type)) {
      current = power.onTrigger(event, { kind: 'player' }, current)
    }
  }
  return current
}

/**
 * 全敵の Powers にイベントを通知し、状態変換を順次適用する（純粋関数）。
 *
 * 敵の順序は enemies 配列の順に従う。各敵の powers は付与順に実行される。
 * 一人の敵の Power 実行後、次の敵の Power は更新済み状態を受け取る。
 *
 * @param event - 発生したゲームイベント
 * @param state - 現在の戦闘状態（BattleState を渡せる）
 * @returns 更新後の戦闘状態
 */
export function notifyEnemyPowers<S extends BattleStateForPower>(event: GameEvent, state: S): S {
  let current: S = state
  for (const enemy of state.enemies) {
    for (const power of enemy.powers) {
      if (power.triggers.includes(event.type)) {
        current = power.onTrigger(event, { kind: 'enemy', id: enemy.id }, current)
      }
    }
  }
  return current
}
