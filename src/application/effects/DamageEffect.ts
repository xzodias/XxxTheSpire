import {
  type SingleTargetEffect,
  type BattleState,
  type EffectContext,
  type EffectServices,
} from './Effect'
import { updateEnemy } from '../../domain/rules/EnemyRules'
import { applyDamageToCharacter } from '../../domain/rules/CombatRules'

/**
 * ダメージエフェクト（アプリケーション層）
 *
 * カードをプレイしたときに単体の敵にダメージを与える（SingleTargetEffect）。
 * ダメージはブロックで先に吸収され、残りが HP に適用される（domain/CombatRules に委譲）。
 *
 * - context.target.kind === 'enemy' を前提とする。それ以外はプログラマーバグ → throw
 * - 全体攻撃（Cleave 等）は AllEnemiesEffect の実装クラスを別途用意する
 * - target.id に対応する敵が enemies に存在しない場合は state をそのまま返す
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class DamageEffect implements SingleTargetEffect {
  readonly targetKind = 'enemy' as const

  constructor(private readonly amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`DamageEffect: amount must be a non-negative integer, got ${amount}`)
    }
  }

  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState {
    void services // SingleTargetEffect インターフェース互換のため省略不可（このエフェクトでは未使用）
    const { target } = context
    if (!target || target.kind !== 'enemy') {
      throw new Error(
        `DamageEffect: context.target must be { kind: 'enemy', id } but got ${JSON.stringify(target)}`,
      )
    }

    const result = updateEnemy(state.enemies, target.id, (enemy) =>
      applyDamageToCharacter(enemy, this.amount),
    )
    // 対象敵が既に存在しない場合（先に倒れた等）は state をそのまま返す
    const updatedEnemies = result.ok ? result.value : state.enemies

    return { ...state, enemies: updatedEnemies }
  }
}
