import {
  type AllEnemiesEffect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from './Effect'
import { applyDamageToCharacter, calculateDamage } from '../../domain/rules/CombatRules'

/**
 * 全体ダメージエフェクト（アプリケーション層）
 *
 * カードをプレイしたときに全ての敵にダメージを与える（AllEnemiesEffect）。
 * 各敵に対して個別にダメージ計算（calculateDamage）とブロック吸収（applyDamageToCharacter）を行う。
 *
 * - context.target.kind === 'all' を前提とする
 * - 各敵の Vulnerable は個別に評価される
 * - 攻撃者（プレイヤー）の Strength / Weak は全敵に共通適用される
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class AllEnemiesDamageEffect implements AllEnemiesEffect {
  readonly targetKind = 'all' as const

  constructor(private readonly amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(
        `AllEnemiesDamageEffect: amount must be a non-negative integer, got ${amount}`,
      )
    }
  }

  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState {
    void context // AllEnemiesEffect: 全敵対象のためターゲット指定不要
    void services // このエフェクトでは未使用
    const updatedEnemies = state.enemies.map((enemy) =>
      applyDamageToCharacter(enemy, calculateDamage(this.amount, state.player, enemy)),
    )
    return { ...state, enemies: updatedEnemies }
  }
}
