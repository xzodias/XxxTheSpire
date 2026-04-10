import {
  type SelfEffect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from './Effect'
import { setPlayerBlock } from '../../domain/rules/PlayerRules'

/**
 * ブロックエフェクト（アプリケーション層）
 *
 * カードをプレイしたときにプレイヤーにブロックを付与する（SelfEffect）。
 * Block.add() を呼び出してイミュータブルに状態を更新する。
 *
 * - context.target を参照しない（プレイヤー自身に適用する）
 * - amount は非負整数でなければならない（負数・小数はコンストラクタで弾く）
 * - 敵状態（enemies）は変更しない
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class BlockEffect implements SelfEffect {
  readonly targetKind = 'player' as const

  constructor(private readonly amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`BlockEffect: amount must be a non-negative integer, got ${amount}`)
    }
  }

  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState {
    void context // SelfEffect: プレイヤー自身に適用するためターゲット不要
    void services // SelfEffect インターフェース互換のため省略不可（このエフェクトでは未使用）
    const updatedBlock = state.player.block.add(this.amount)
    return { ...state, player: setPlayerBlock(state.player, updatedBlock) }
  }
}
