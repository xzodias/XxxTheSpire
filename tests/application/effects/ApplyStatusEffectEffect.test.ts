/**
 * ApplyStatusEffectEffect テスト（RED フェーズ）
 *
 * 対象: src/application/effects/ApplyStatusEffectEffect.ts（未実装）
 *       および EffectFactory への 'apply_status_effect' エントリ追加（未実装）
 *
 * カバー AC:
 *   AC1 — ApplyStatusEffectEffect が敵 / プレイヤーに状態効果を付与する
 *          EffectFactory が 'apply_status_effect' で正しく Effect を生成する（観点26/27）
 *
 * AC3（UI 表示）はこのファイルではテスト対象外とする。
 * UI 層のテストは presentation/ 配下のコンポーネントテストで別途実施すること。
 *
 * EffectDef の型拡張について:
 *   現時点の EffectDef には statusEffectType フィールドが存在しない。
 *   実装時に EffectDef を拡張するか、apply_status_effect 専用の EffectDef 派生型を追加すること。
 *   Factory テスト（観点26/27）は EffectDef 拡張後に型アサーションを除去できる。
 */
import { describe, it, expect } from 'vitest'
import { ApplyStatusEffectEffect } from '../../../src/application/effects/ApplyStatusEffectEffect'
import { EffectFactory } from '../../../src/application/effects/EffectFactory'
import { type BattleState } from '../../../src/domain/entities/BattleState'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type StatusEffect, StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId, type StatusEffectId } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Gold } from '../../../src/domain/value-objects/Gold'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeEnemyId(id: string): EnemyId {
  return id as EnemyId
}

function makeStatusEffect(type: StatusEffectType, stacks: number, duration: number): StatusEffect {
  return {
    id: `${type}_test` as StatusEffectId,
    name: type,
    type,
    stacks,
    duration,
  }
}

function makeEnemy(
  id: string,
  overrides?: Partial<{
    currentHp: number
    maxHp: number
    block: number
    statusEffects: StatusEffect[]
  }>,
): Enemy {
  const hp = Health.create(overrides?.currentHp ?? 50, overrides?.maxHp ?? 50)
  const block = Block.create(overrides?.block ?? 0)
  if (!hp.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id,
    name: `Enemy_${id}`,
    enemyId: makeEnemyId(id),
    intent: { type: 'unknown' },
    health: hp.value,
    block: block.value,
    powers: [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makePlayer(
  overrides?: Partial<{
    currentHp: number
    maxHp: number
    block: number
    statusEffects: StatusEffect[]
  }>,
): Player {
  const health = Health.create(overrides?.currentHp ?? 80, overrides?.maxHp ?? 80)
  const energy = Energy.create(3, 3)
  const gold = Gold.create(0)
  const block = Block.create(overrides?.block ?? 0)
  if (!health.ok) throw new Error('Failed to create health')
  if (!energy.ok) throw new Error('Failed to create energy')
  if (!gold.ok) throw new Error('Failed to create gold')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id: 'ironclad',
    name: 'Ironclad',
    health: health.value,
    energy: energy.value,
    gold: gold.value,
    block: block.value,
    deck: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makeBattleState(player: Player, enemies: Enemy[]): BattleState {
  return { player, enemies }
}

function makeServices(): { random: IRandomService } {
  return {
    random: {
      next: () => 0,
      nextInt: (min: number) => min,
      shuffle: <T>(array: readonly T[]): readonly T[] => [...array],
    },
  }
}

// ─────────────────────────────────────────────
// ApplyStatusEffectEffect — AC1: 敵への状態効果付与
// ─────────────────────────────────────────────

describe('ApplyStatusEffectEffect — AC1: 敵への状態効果付与', () => {
  it('観点01: 正常系 — Vulnerable(amount=2) を敵に付与すると対象敵の statusEffects に Vulnerable(duration=2) が追加される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Vulnerable, 2, 'enemy')
    const result = effect.apply(state, context, makeServices())

    const resultEnemy = result.enemies.find((e) => e.id === 'jaw_worm')
    const vulnerable = resultEnemy?.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable).toBeDefined()
    expect(vulnerable?.duration).toBe(2)
  })

  it('観点01: 正常系 — Weak(amount=3) を敵に付与すると対象敵の statusEffects に Weak(duration=3) が追加される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Weak, 3, 'enemy')
    const result = effect.apply(state, context, makeServices())

    const resultEnemy = result.enemies.find((e) => e.id === 'jaw_worm')
    const weak = resultEnemy?.statusEffects.find((s) => s.type === StatusEffectType.Weak)
    expect(weak?.duration).toBe(3)
  })

  it('観点01: 正常系 — 既存 Vulnerable(duration=1) の敵に Vulnerable(amount=2) を付与すると duration=3 になる（加算）', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Vulnerable, 2, 'enemy')
    const result = effect.apply(state, context, makeServices())

    const resultEnemy = result.enemies.find((e) => e.id === 'jaw_worm')
    const vulnerable = resultEnemy?.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable?.duration).toBe(3)
  })

  it('観点01: 正常系 — 対象外の敵の statusEffects は変化しない（単体ターゲット）', () => {
    const player = makePlayer()
    const enemy1 = makeEnemy('jaw_worm')
    const enemy2 = makeEnemy('louse')
    const state = makeBattleState(player, [enemy1, enemy2])
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Vulnerable, 2, 'enemy')
    const result = effect.apply(state, context, makeServices())

    const resultLouse = result.enemies.find((e) => e.id === 'louse')
    const vulnerable = resultLouse?.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable).toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// ApplyStatusEffectEffect — AC1: プレイヤーへの状態効果付与
// ─────────────────────────────────────────────

describe('ApplyStatusEffectEffect — AC1: プレイヤーへの状態効果付与', () => {
  it('観点01: 正常系 — Vulnerable(amount=2) をプレイヤーに付与すると player.statusEffects に Vulnerable(duration=2) が追加される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'player' as const } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Vulnerable, 2, 'player')
    const result = effect.apply(state, context, makeServices())

    const vulnerable = result.player.statusEffects.find(
      (s) => s.type === StatusEffectType.Vulnerable,
    )
    expect(vulnerable).toBeDefined()
    expect(vulnerable?.duration).toBe(2)
  })

  it('観点01: 正常系 — Strength(amount=3) をプレイヤーに付与すると player.statusEffects に Strength(stacks=3) が追加される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'player' as const } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Strength, 3, 'player')
    const result = effect.apply(state, context, makeServices())

    const strength = result.player.statusEffects.find((s) => s.type === StatusEffectType.Strength)
    expect(strength?.stacks).toBe(3)
  })
})

// ─────────────────────────────────────────────
// ApplyStatusEffectEffect — AC1: イミュータビリティ（観点11）
// ─────────────────────────────────────────────

describe('ApplyStatusEffectEffect — AC1: イミュータビリティ', () => {
  it('観点11: apply() は元の BattleState.enemies を変更しない', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const originalEnemyEffects = state.enemies[0]?.statusEffects
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Vulnerable, 2, 'enemy')
    effect.apply(state, context, makeServices())

    expect(state.enemies[0]?.statusEffects).toBe(originalEnemyEffects)
    expect(state.enemies[0]?.statusEffects.length).toBe(0)
  })

  it('観点11: apply() の戻り値は元の state と別のオブジェクトである', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const context = { target: { kind: 'enemy' as const, id: makeEnemyId('jaw_worm') } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Weak, 1, 'enemy')
    const result = effect.apply(state, context, makeServices())

    expect(result).not.toBe(state)
    expect(result.enemies).not.toBe(state.enemies)
  })

  it('観点11: apply() はプレイヤー付与時に元の player.statusEffects を変更しない', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    const state = makeBattleState(player, [enemy])
    const originalPlayerEffects = state.player.statusEffects
    const context = { target: { kind: 'player' as const } }

    const effect = new ApplyStatusEffectEffect(StatusEffectType.Strength, 2, 'player')
    effect.apply(state, context, makeServices())

    expect(state.player.statusEffects).toBe(originalPlayerEffects)
    expect(state.player.statusEffects.length).toBe(0)
  })
})

// ─────────────────────────────────────────────
// EffectFactory — 観点26/27: 'apply_status_effect' の正常生成・異常生成
// ─────────────────────────────────────────────

describe('EffectFactory — 観点26: apply_status_effect の正常生成', () => {
  it('観点26: 正常生成 — type="apply_status_effect" かつ statusEffectType="Vulnerable" で ok(Effect[]) が返る', () => {
    const result = EffectFactory.build([
      { type: 'apply_status_effect', value: 2, target: 'enemy', statusEffectType: 'Vulnerable' },
    ])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
    }
  })

  it('観点26: 正常生成 — statusEffectType="Strength" で Strength 付与 Effect が生成される', () => {
    const result = EffectFactory.build([
      { type: 'apply_status_effect', value: 3, target: 'enemy', statusEffectType: 'Strength' },
    ])
    expect(result.ok).toBe(true)
  })
})

describe('EffectFactory — 観点27: apply_status_effect の異常生成', () => {
  it('観点27: 異常生成 — statusEffectType が未知の値のとき err が返る', () => {
    const result = EffectFactory.build([
      { type: 'apply_status_effect', value: 2, target: 'enemy', statusEffectType: 'UnknownEffect' },
    ])
    expect(result.ok).toBe(false)
  })

  it('観点27: 異常生成 — value が負数のとき err が返る', () => {
    const result = EffectFactory.build([
      { type: 'apply_status_effect', value: -1, target: 'enemy', statusEffectType: 'Vulnerable' },
    ])
    expect(result.ok).toBe(false)
  })
})
