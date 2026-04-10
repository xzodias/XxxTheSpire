import { type IRandomService } from '../../domain/interfaces/IRandomService'
import { type Target } from '../../shared/types'
import { type BattleState } from '../../domain/entities/BattleState'

export type { BattleState }

/**
 * カードプレイ時の一時ターゲット情報（アプリケーション層）
 *
 * BattleState（永続戦闘状態）とは異なり、カード1枚のプレイ時にのみ存在する
 * 一時的なコンテキスト。エフェクトパイプライン全体を通じて変わらない。
 *
 * - SingleTargetEffect は context.target.kind === 'enemy' を必要とする
 * - AllEnemiesEffect は context.target.kind === 'all' を使用する
 * - SelfEffect は context.target を参照しない
 */
export interface EffectContext {
  readonly target?: Target
}

/**
 * エフェクト実行時に注入するサービス群（アプリケーション層）
 *
 * 戦闘状態（BattleState）とは別に管理するサービスの集合。
 * エフェクトの入力にも出力にもならないため BattleState から分離する。
 */
export interface EffectServices {
  readonly random: IRandomService
}

/**
 * カードエフェクトの基底インターフェース（アプリケーション層）
 *
 * apply() は純粋関数として実装する（副作用なし・イミュータブル）。
 * EffectExecutor での利用イメージ:
 *   effects.reduce((state, effect) => effect.apply(state, context, services), initialState)
 *
 * 参照可能な層: domain, application/effects
 * 参照してはいけない層: infrastructure, presentation
 */
export interface Effect {
  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState
}

/**
 * 単体敵ターゲットエフェクト（アプリケーション層）
 *
 * context.target.kind === 'enemy' を前提とするエフェクト。
 * DamageEffect 等、単体敵を対象とするカード効果に使用する。
 * target が enemy 以外の場合はプログラマーバグとして throw する。
 */
export interface SingleTargetEffect extends Effect {
  readonly targetKind: 'enemy'
}

/**
 * 全体敵ターゲットエフェクト（アプリケーション層）
 *
 * context.target.kind === 'all' を前提とするエフェクト。
 * Whirlwind / Cleave 等、全体攻撃カード効果に使用する。
 */
export interface AllEnemiesEffect extends Effect {
  readonly targetKind: 'all'
}

/**
 * プレイヤー自身へのエフェクト（アプリケーション層）
 *
 * context.target を参照しない。
 * BlockEffect / DrawEffect 等、自身に効果を与えるカード効果に使用する。
 */
export interface SelfEffect extends Effect {
  readonly targetKind: 'player'
}
