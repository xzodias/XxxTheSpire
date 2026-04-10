import {
  type SelfEffect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from './Effect'
import { drawCards } from '../../domain/rules/DeckRules'

/**
 * ドローエフェクト（アプリケーション層）
 *
 * カードをプレイしたときに山札から count 枚ドローする（SelfEffect）。
 * DeckRules.drawCards() を呼び出してイミュータブルに状態を更新する。
 *
 * - context.target を参照しない（プレイヤー自身に適用する）
 * - count は非負整数でなければならない（負数・小数はコンストラクタで弾く）
 * - 敵状態（enemies）は変更しない
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class DrawEffect implements SelfEffect {
  readonly targetKind = 'player' as const

  constructor(private readonly count: number) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`DrawEffect: count must be a non-negative integer, got ${count}`)
    }
  }

  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState {
    void context // SelfEffect: プレイヤー自身に適用するためターゲット不要
    const { player: updatedPlayer } = drawCards(state.player, this.count, services.random)
    return { ...state, player: updatedPlayer }
  }
}
