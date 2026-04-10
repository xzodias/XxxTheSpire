import { type Effect, type BattleState, type EffectContext, type EffectServices } from './Effect'

/**
 * エフェクトパイプライン実行関数（アプリケーション層）
 *
 * Effect[] を受け取り、順番に BattleState へ適用して最終状態を返す。
 * 各エフェクトの出力が次のエフェクトの入力になる（パイプラインパターン）。
 *
 * - effects が空の場合は初期状態をそのまま返す
 * - context はパイプライン全体で共有される（各エフェクトが参照）
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export function executeEffects(
  effects: readonly Effect[],
  state: BattleState,
  context: EffectContext,
  services: EffectServices,
): BattleState {
  return effects.reduce(
    (currentState, effect) => effect.apply(currentState, context, services),
    state,
  )
}
