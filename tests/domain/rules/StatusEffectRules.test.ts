/**
 * StatusEffectRules テスト（RED フェーズ）
 *
 * 対象: src/domain/rules/StatusEffectRules.ts（未実装）
 *
 * カバー AC:
 *   AC1 — 状態効果のスタック数が正しく増減すること
 *   AC2 — ターン終了時に継続時間が短縮・消滅する状態効果が正しく処理されること
 *
 * AC3（UI 表示）はこのファイルではテスト対象外とする。
 * UI 層のテストは presentation/ 配下のコンポーネントテストで別途実施すること。
 */
import { describe, it, expect } from 'vitest'
import { addStatusEffect, tickStatusEffects } from '../../../src/domain/rules/StatusEffectRules'
import { type Combatant } from '../../../src/domain/entities/Character'
import { type StatusEffect, StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { type StatusEffectId } from '../../../src/shared/types'

import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeStatusEffect(type: StatusEffectType, stacks: number, duration: number): StatusEffect {
  return {
    id: `${type}_test` as StatusEffectId,
    name: type,
    type,
    stacks,
    duration,
  }
}

function makeCombatant(statusEffects: StatusEffect[] = []): Combatant {
  const health = Health.create(50, 50)
  const block = Block.create(0)
  if (!health.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')
  return {
    health: health.value,
    block: block.value,
    powers: [],
    statusEffects,
  }
}

// ─────────────────────────────────────────────
// addStatusEffect — AC1: スタック型（Strength / Dexterity / Artifact）
// ─────────────────────────────────────────────

describe('addStatusEffect — AC1: スタック型の加算', () => {
  it('観点01: 正常系 — Strength を持たない Combatant に Strength(3) を付与すると stacks=3 の StatusEffect が追加される', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Strength, 3)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Strength)
    expect(se).toBeDefined()
    expect(se?.stacks).toBe(3)
  })

  it('観点01: 正常系 — 既存 Strength(2) に Strength(3) を付与すると stacks=5 になる（スタック加算）', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Strength, 2, 0)])
    const result = addStatusEffect(combatant, StatusEffectType.Strength, 3)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Strength)
    expect(se?.stacks).toBe(5)
  })

  it('観点02: 境界値（最小正常値）— amount=1 で正常に付与される', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Strength, 1)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Strength)
    expect(se?.stacks).toBe(1)
  })

  it('観点02: 境界値 — amount=0 を付与しても stacks は増えない（既存がなければ追加されないか stacks=0）', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Strength, 0)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Strength)
    expect(se?.stacks ?? 0).toBe(0)
  })

  it('観点16: 複数の異なるスタック型エフェクトが同時に存在できる', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Strength, 2, 0)])
    const result = addStatusEffect(combatant, StatusEffectType.Dexterity, 4)
    const strength = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Strength,
    )
    const dexterity = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Dexterity,
    )
    expect(strength?.stacks).toBe(2)
    expect(dexterity?.stacks).toBe(4)
  })
})

// ─────────────────────────────────────────────
// addStatusEffect — AC1: 持続ターン型（Vulnerable / Weak）
// ─────────────────────────────────────────────

describe('addStatusEffect — AC1: 持続ターン型の加算', () => {
  it('観点01: 正常系 — Vulnerable を持たない Combatant に Vulnerable(2) を付与すると duration=2 になる', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Vulnerable, 2)
    const se = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Vulnerable,
    )
    expect(se).toBeDefined()
    expect(se?.duration).toBe(2)
  })

  it('観点01: 正常系 — 既存 Vulnerable(duration=1) に Vulnerable(2) を付与すると duration=3 になる', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)])
    const result = addStatusEffect(combatant, StatusEffectType.Vulnerable, 2)
    const se = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Vulnerable,
    )
    expect(se?.duration).toBe(3)
  })

  it('観点01: 正常系 — Weak(3) を付与すると duration=3 になる', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Weak, 3)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Weak)
    expect(se?.duration).toBe(3)
  })
})

// ─────────────────────────────────────────────
// addStatusEffect — AC1: イミュータビリティ（観点11）
// ─────────────────────────────────────────────

describe('addStatusEffect — AC1: イミュータビリティ', () => {
  it('観点11: addStatusEffect は元の Combatant オブジェクトを変更しない', () => {
    const original = makeCombatant([makeStatusEffect(StatusEffectType.Strength, 2, 0)])
    const originalEffects = original.statusEffects
    const originalStacks = original.statusEffects[0]?.stacks

    addStatusEffect(original, StatusEffectType.Strength, 3)

    expect(original.statusEffects).toBe(originalEffects)
    expect(original.statusEffects[0]?.stacks).toBe(originalStacks)
  })

  it('観点11: addStatusEffect の戻り値は元の Combatant と別のオブジェクトである', () => {
    const combatant = makeCombatant()
    const result = addStatusEffect(combatant, StatusEffectType.Strength, 3)
    expect(result).not.toBe(combatant)
    expect(result.statusEffects).not.toBe(combatant.statusEffects)
  })
})

// ─────────────────────────────────────────────
// tickStatusEffects — AC2: 持続ターン型の減算・消滅
// ─────────────────────────────────────────────

describe('tickStatusEffects — AC2: 持続ターン型の tick', () => {
  it('観点01: 正常系 — Vulnerable(duration=2) を tick すると duration=1 になる', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)])
    const result = tickStatusEffects(combatant)
    const se = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Vulnerable,
    )
    expect(se?.duration).toBe(1)
  })

  it('観点13: 有効遷移 — Weak(duration=1) を tick すると StatusEffect が除去される（duration が 0 になったら消滅）', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Weak, 0, 1)])
    const result = tickStatusEffects(combatant)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Weak)
    expect(se).toBeUndefined()
  })

  it('観点02: 境界値 — duration=0 の持続型エフェクトは tick 後も除去される', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Vulnerable, 0, 0)])
    const result = tickStatusEffects(combatant)
    const se = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Vulnerable,
    )
    expect(se).toBeUndefined()
  })

  it('観点16: 複数の持続型エフェクトがそれぞれ正しく tick される', () => {
    const combatant = makeCombatant([
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 3),
      makeStatusEffect(StatusEffectType.Weak, 0, 1),
    ])
    const result = tickStatusEffects(combatant)
    const vulnerable = result.statusEffects.find(
      (s: StatusEffect) => s.type === StatusEffectType.Vulnerable,
    )
    const weak = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Weak)
    expect(vulnerable?.duration).toBe(2)
    expect(weak).toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// tickStatusEffects — AC2: スタック型は tick で変化しない
// ─────────────────────────────────────────────

describe('tickStatusEffects — AC2: スタック型は tick で不変', () => {
  it('観点01: Strength(stacks=3) は tickStatusEffects で stacks が変化しない', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Strength, 3, 0)])
    const result = tickStatusEffects(combatant)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Strength)
    expect(se?.stacks).toBe(3)
  })

  it('観点01: Dexterity(stacks=5) は tickStatusEffects で stacks が変化しない', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Dexterity, 5, 0)])
    const result = tickStatusEffects(combatant)
    const se = result.statusEffects.find((s: StatusEffect) => s.type === StatusEffectType.Dexterity)
    expect(se?.stacks).toBe(5)
  })
})

// ─────────────────────────────────────────────
// tickStatusEffects — AC2: イミュータビリティ（観点11）
// ─────────────────────────────────────────────

describe('tickStatusEffects — AC2: イミュータビリティ', () => {
  it('観点11: tickStatusEffects は元の Combatant を変更しない', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Vulnerable, 0, 2)])
    const originalDuration = combatant.statusEffects[0]?.duration

    tickStatusEffects(combatant)

    expect(combatant.statusEffects[0]?.duration).toBe(originalDuration)
  })

  it('観点11: tickStatusEffects の戻り値は元の Combatant と別のオブジェクトである', () => {
    const combatant = makeCombatant([makeStatusEffect(StatusEffectType.Weak, 0, 2)])
    const result = tickStatusEffects(combatant)
    expect(result).not.toBe(combatant)
    expect(result.statusEffects).not.toBe(combatant.statusEffects)
  })
})
