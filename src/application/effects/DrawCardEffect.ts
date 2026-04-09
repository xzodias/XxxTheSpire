import { type Effect, type BattleState, type EffectServices } from './Effect'
import { drawCards } from '../../domain/rules/DeckRules'

/**
 * ドローエフェクト（アプリケーション層）
 *
 * カードをプレイしたときに山札から count 枚ドローする。
 * DeckRules.drawCards() を呼び出してイミュータブルに状態を更新する。
 *
 * - count は非負整数でなければならない（負数・小数はコンストラクタで弾く）
 * - 敵状態（enemies）は変更しない
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class DrawCardEffect implements Effect {
  constructor(private readonly count: number) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`DrawCardEffect: count must be a non-negative integer, got ${count}`)
    }
  }

  apply(state: BattleState, services: EffectServices): BattleState {
    const { player: updatedPlayer } = drawCards(state.player, this.count, services.random)
    return { ...state, player: updatedPlayer }
  }
}
