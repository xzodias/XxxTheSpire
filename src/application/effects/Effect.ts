import { type Player } from '../../domain/entities/Player'
import { type Enemy } from '../../domain/entities/Enemy'
import { type IRandomService } from '../../domain/interfaces/IRandomService'

/**
 * エフェクト適用対象の戦闘状態（アプリケーション層）
 *
 * エフェクトが読み取り・更新する戦闘状態のスナップショット。
 * domain の Combat エンティティ（turn を含む）のサブセットとして設計し、
 * エフェクトが必要とする最小限の状態のみを保持する。
 *
 * - turn は含まない（ターン数依存エフェクトが必要になった際に拡張する）
 * - EffectServices と分離することで「状態（何が変わるか）」と
 *   「サービス（どう変えるか）」の責務を明確にする
 */
export interface BattleState {
  readonly player: Player
  readonly enemies: readonly Enemy[]
}

/**
 * エフェクト実行時に注入するサービス群（アプリケーション層）
 *
 * 戦闘状態（BattleState）とは別に管理するサービスの集合。
 * エフェクトの入力にも出力にもならないため BattleState から分離する。
 * EffectExecutor（#135）がエフェクトパイプライン全体で使い回す。
 */
export interface EffectServices {
  readonly random: IRandomService
}

/**
 * カードエフェクトのインターフェース（アプリケーション層）
 *
 * カード JSON の effects 配列から生成される実行可能なエフェクト単位。
 * EffectFactory が EffectDef → Effect[] に変換し、各エフェクトが apply() を通じて
 * 戦闘状態を更新する。
 *
 * - apply() は純粋関数として実装する（副作用なし・イミュータブル）
 * - EffectExecutor での利用イメージ:
 *   effects.reduce((state, effect) => effect.apply(state, services), initialState)
 * - 参照可能な層: domain, application/effects
 * - 参照してはいけない層: infrastructure, presentation
 */
export interface Effect {
  apply(state: BattleState, services: EffectServices): BattleState
}
