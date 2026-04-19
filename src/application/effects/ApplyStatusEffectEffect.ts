import { type Effect, type BattleState, type EffectContext, type EffectServices } from './Effect'
import { type StatusEffectType } from '../../domain/entities/StatusEffect'
import { addStatusEffect } from '../../domain/rules/StatusEffectRules'
import { updateEnemy } from '../../domain/rules/EnemyRules'

/**
 * 状態効果付与エフェクト（アプリケーション層）
 *
 * カードプレイ時に対象（敵またはプレイヤー）に状態効果を付与する。
 *
 * - targetKind === 'enemy': context.target.kind === 'enemy' の単体敵を対象とする
 * - targetKind === 'player': プレイヤー自身を対象とする
 *
 * 参照可能な層: domain, application/effects のみ
 * 参照してはいけない層: infrastructure, presentation
 */
export class ApplyStatusEffectEffect implements Effect {
  constructor(
    private readonly statusEffectType: StatusEffectType,
    private readonly amount: number,
    readonly targetKind: 'enemy' | 'player',
  ) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(
        `ApplyStatusEffectEffect: amount must be a non-negative integer, got ${amount}`,
      )
    }
  }

  apply(state: BattleState, context: EffectContext, services: EffectServices): BattleState {
    void services

    if (this.targetKind === 'player') {
      const updatedPlayer = addStatusEffect(state.player, this.statusEffectType, this.amount)
      return { ...state, player: updatedPlayer }
    }

    // targetKind === 'enemy'
    const { target } = context
    if (!target || target.kind !== 'enemy') {
      throw new Error(
        `ApplyStatusEffectEffect: context.target must be { kind: 'enemy', id } but got ${JSON.stringify(target)}`,
      )
    }

    const result = updateEnemy(state.enemies, target.id, (enemy) =>
      addStatusEffect(enemy, this.statusEffectType, this.amount),
    )
    if (!result.ok) {
      throw new Error(`ApplyStatusEffectEffect: enemy not found: ${target.id}`)
    }

    return { ...state, enemies: result.value }
  }
}
