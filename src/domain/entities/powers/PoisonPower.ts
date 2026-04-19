import { type PowerId } from '../../../shared/types'
import { type GameEvent } from '../Relic'
import { type Power, type PowerOwner, type BattleStateForPower } from '../Power'

/**
 * Poison パワー（ドメイン層）
 *
 * ターン開始時にスタック数分の直接 HP ダメージを与え、スタック数を1減算する。
 * スタックが 0 以下になったら powers 配列から除去される。
 *
 * 処理順（on_turn_start）:
 *   1. オーナー（player または 対象 enemy）に stacks 分のダメージ（ブロック無視）
 *   2. stacks を 1 減算。0 以下になったら powers から除去
 *
 * on_turn_end には反応しない。
 *
 * 参照可能な層: domain/entities, domain/value-objects のみ
 */
export class PoisonPower implements Power {
  readonly id: PowerId = 'poison' as PowerId
  readonly name = 'Poison'
  readonly triggers: readonly GameEvent['type'][] = ['on_turn_start']

  constructor(readonly stacks: number) {}

  onTrigger<S extends BattleStateForPower>(event: GameEvent, owner: PowerOwner, state: S): S {
    if (owner.kind === 'player') {
      return this.applyToPlayer(state)
    }
    return this.applyToEnemy(state, owner.id)
  }

  private applyToPlayer<S extends BattleStateForPower>(state: S): S {
    const newHealth = state.player.health.takeDamage(this.stacks)
    const newStacks = this.stacks - 1
    const newPowers: readonly Power[] =
      newStacks <= 0
        ? state.player.powers.filter((p) => p.id !== this.id)
        : state.player.powers.map((p) => (p.id === this.id ? new PoisonPower(newStacks) : p))

    // `as S` is required because TypeScript cannot verify that spreading state and state.player
    // preserves all extra fields of S (e.g. Player.energy, deck, hand, etc.).
    // At runtime, the spread IS safe — all fields of S beyond BattleStateForPower are preserved.
    return {
      ...state,
      player: { ...state.player, health: newHealth, powers: newPowers },
    } as S
  }

  private applyToEnemy<S extends BattleStateForPower>(state: S, enemyId: string): S {
    const updatedEnemies = state.enemies.map((enemy) => {
      if (enemy.id !== enemyId) return enemy

      const newHealth = enemy.health.takeDamage(this.stacks)
      const newStacks = this.stacks - 1
      const newPowers: readonly Power[] =
        newStacks <= 0
          ? enemy.powers.filter((p) => p.id !== this.id)
          : enemy.powers.map((p) => (p.id === this.id ? new PoisonPower(newStacks) : p))

      return { ...enemy, health: newHealth, powers: newPowers }
    })

    // `as S` — same rationale as applyToPlayer: spread preserves all extra fields at runtime.
    return { ...state, enemies: updatedEnemies } as S
  }
}
