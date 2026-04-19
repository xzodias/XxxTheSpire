/**
 * PoisonPower 単体テスト（RED フェーズ）
 *
 * 対象: src/domain/entities/powers/PoisonPower.ts（未実装）
 *
 * カバー AC:
 *   AC4 — on_turn_start でスタック数分の HP ダメージを与え、スタックを 1 減算する
 *          stacks が 0 になったら powers から自身を除去する
 *          on_turn_end には反応しない
 *
 * テスト観点マッピング:
 *   観点01 — 正常系（プレイヤー保有・敵保有）
 *   観点02 — 境界値（stacks=1 で Poison が除去される）
 *   観点11 — イミュータビリティ（元の BattleState を変更しない）
 *   観点13 — 状態遷移（on_turn_end には反応しない）
 *   観点16 — 複数条件の組み合わせ（player/enemy それぞれのケース）
 *   観点28 — 冪等性（同一入力で同一結果）
 */
import { describe, it, expect } from 'vitest'
import { PoisonPower } from '../../../src/domain/entities/powers/PoisonPower'
import {
  type Power,
  type BattleStateForPower,
  type PowerOwner,
  notifyPlayerPowers,
} from '../../../src/domain/entities/Power'
import { type GameEvent } from '../../../src/domain/entities/Relic'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { type PowerId } from '../../../src/shared/types'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeHealth(current: number, max: number): Health {
  const result = Health.create(current, max)
  if (!result.ok) throw new Error(`Failed to create Health: ${result.error}`)
  return result.value
}

function makeBlock(value: number): Block {
  const result = Block.create(value)
  if (!result.ok) throw new Error(`Failed to create Block: ${result.error}`)
  return result.value
}

function makePoisonPower(stacks: number): Power {
  return new PoisonPower(stacks)
}

/**
 * プレイヤーが PoisonPower を保有する BattleStateForPower を生成する。
 * player.powers に PoisonPower が含まれ、enemy は空のリストとなる。
 */
function makeStateWithPlayerPoison(
  playerCurrentHp: number,
  playerMaxHp: number,
  poisonStacks: number,
): BattleStateForPower {
  const poison = makePoisonPower(poisonStacks)
  return {
    player: {
      health: makeHealth(playerCurrentHp, playerMaxHp),
      block: makeBlock(0),
      powers: [poison],
      statusEffects: [],
    },
    enemies: [],
  }
}

/**
 * 指定した enemyId を持つ敵が PoisonPower を保有する BattleStateForPower を生成する。
 * player.powers は空のリストとなる。
 */
function makeStateWithEnemyPoison(
  enemyId: string,
  enemyCurrentHp: number,
  enemyMaxHp: number,
  poisonStacks: number,
): BattleStateForPower {
  const poison = makePoisonPower(poisonStacks)
  return {
    player: {
      health: makeHealth(50, 50),
      block: makeBlock(0),
      powers: [],
      statusEffects: [],
    },
    enemies: [
      {
        id: enemyId,
        health: makeHealth(enemyCurrentHp, enemyMaxHp),
        block: makeBlock(0),
        powers: [poison],
        statusEffects: [],
      },
    ],
  }
}

const ON_TURN_START: GameEvent = { type: 'on_turn_start' }
const ON_TURN_END: GameEvent = { type: 'on_turn_end' }

const PLAYER_OWNER: PowerOwner = { kind: 'player' }

function enemyOwner(id: string): PowerOwner {
  return { kind: 'enemy', id }
}

// ─────────────────────────────────────────────
// AC4: on_turn_start — プレイヤー保有ケース
// ─────────────────────────────────────────────

describe('PoisonPower — AC4: on_turn_start (プレイヤー保有)', () => {
  it('観点01: 正常系 — プレイヤーが stacks=3 の PoisonPower を持つとき、on_turn_start で HP が 3 減り stacks が 2 になる', () => {
    const poison = makePoisonPower(3)
    const state = makeStateWithPlayerPoison(30, 50, 3)

    const result = poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)

    expect(result.player.health.current).toBe(27)

    const updatedPoison = result.player.powers.find((p) => p.id === ('poison' as PowerId))
    expect(updatedPoison).toBeDefined()
    expect(updatedPoison?.stacks).toBe(2)
  })

  it('観点02: 境界値（最小正常値）— プレイヤーが stacks=1 の PoisonPower を持つとき、on_turn_start で HP が 1 減り PoisonPower が除去される', () => {
    const poison = makePoisonPower(1)
    const state = makeStateWithPlayerPoison(30, 50, 1)

    const result = poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)

    expect(result.player.health.current).toBe(29)

    const remainingPoison = result.player.powers.find((p) => p.id === ('poison' as PowerId))
    expect(remainingPoison).toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// AC4: on_turn_start — 敵保有ケース
// ─────────────────────────────────────────────

describe('PoisonPower — AC4: on_turn_start (敵保有)', () => {
  it('観点16: 複数条件の組み合わせ — 敵が stacks=4 の PoisonPower を持つとき、on_turn_start でその敵の HP が 4 減り stacks が 3 になる', () => {
    const poison = makePoisonPower(4)
    const state = makeStateWithEnemyPoison('jaw_worm', 40, 40, 4)

    const result = poison.onTrigger(ON_TURN_START, enemyOwner('jaw_worm'), state)

    const enemy = result.enemies.find((e) => e.id === 'jaw_worm')
    expect(enemy).toBeDefined()
    expect(enemy?.health.current).toBe(36)

    const updatedPoison = enemy?.powers.find((p) => p.id === ('poison' as PowerId))
    expect(updatedPoison).toBeDefined()
    expect(updatedPoison?.stacks).toBe(3)
  })

  it('観点02: 境界値（最小正常値）— 敵が stacks=1 の PoisonPower を持つとき、on_turn_start でその敵の HP が 1 減り PoisonPower が除去される', () => {
    const poison = makePoisonPower(1)
    const state = makeStateWithEnemyPoison('cultist', 20, 20, 1)

    const result = poison.onTrigger(ON_TURN_START, enemyOwner('cultist'), state)

    const enemy = result.enemies.find((e) => e.id === 'cultist')
    expect(enemy).toBeDefined()
    expect(enemy?.health.current).toBe(19)

    const remainingPoison = enemy?.powers.find((p) => p.id === ('poison' as PowerId))
    expect(remainingPoison).toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// AC4: on_turn_end — 反応しない
// ─────────────────────────────────────────────

describe('PoisonPower — AC4: on_turn_end には反応しない', () => {
  it('観点13: 状態遷移 — notifyPlayerPowers で on_turn_end を送っても HP・stacks が変化しない', () => {
    const state = makeStateWithPlayerPoison(30, 50, 3)

    // onTrigger の呼び出しは notifyPlayerPowers 経由で行うのが正しい設計
    // triggers に含まれない event.type は notifyPlayerPowers がフィルタするため Poison は発火しない
    const result = notifyPlayerPowers(ON_TURN_END, state)

    expect(result.player.health.current).toBe(30)

    const remainingPoison = result.player.powers.find((p) => p.id === ('poison' as PowerId))
    expect(remainingPoison?.stacks).toBe(3)
  })
})

// ─────────────────────────────────────────────
// AC4: イミュータビリティ
// ─────────────────────────────────────────────

describe('PoisonPower — AC4: イミュータビリティ', () => {
  it('観点11: 元の BattleState を変更しない（プレイヤー保有ケース）', () => {
    const poison = makePoisonPower(3)
    const state = makeStateWithPlayerPoison(30, 50, 3)

    const originalHp = state.player.health.current
    const originalPowers = state.player.powers
    const originalPoisonStacks = state.player.powers[0]?.stacks

    poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)

    expect(state.player.health.current).toBe(originalHp)
    expect(state.player.powers).toBe(originalPowers)
    expect(state.player.powers[0]?.stacks).toBe(originalPoisonStacks)
  })

  it('観点11: 戻り値は元の state と別のオブジェクトである（プレイヤー保有ケース）', () => {
    const poison = makePoisonPower(3)
    const state = makeStateWithPlayerPoison(30, 50, 3)

    const result = poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)

    expect(result).not.toBe(state)
    expect(result.player).not.toBe(state.player)
    expect(result.player.powers).not.toBe(state.player.powers)
  })
})

// ─────────────────────────────────────────────
// AC4: 冪等性
// ─────────────────────────────────────────────

describe('PoisonPower — AC4: 冪等性', () => {
  it('観点28: 同じ入力を2回与えると同じ結果が返る（プレイヤー保有ケース）', () => {
    const poison = makePoisonPower(3)
    const state = makeStateWithPlayerPoison(30, 50, 3)

    const result1 = poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)
    const result2 = poison.onTrigger(ON_TURN_START, PLAYER_OWNER, state)

    expect(result1.player.health.current).toBe(result2.player.health.current)

    const poison1 = result1.player.powers.find((p) => p.id === ('poison' as PowerId))
    const poison2 = result2.player.powers.find((p) => p.id === ('poison' as PowerId))
    expect(poison1?.stacks).toBe(poison2?.stacks)
  })
})
