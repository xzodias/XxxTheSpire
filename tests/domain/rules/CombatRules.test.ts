import { describe, it, expect } from 'vitest'
import {
  applyDamageToCharacter,
  calculateDamage,
  calculateBlock,
} from '../../../src/domain/rules/CombatRules'
import { type Combatant } from '../../../src/domain/entities/Character'
import { type StatusEffect } from '../../../src/domain/entities/StatusEffect'
import { StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { type StatusEffectId } from '../../../src/shared/types'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeCombatant(hp: number, blockValue: number): Combatant {
  const health = Health.create(hp, hp)
  const block = Block.create(blockValue)
  if (!health.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')
  return { health: health.value, block: block.value, powers: [], statusEffects: [] }
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

function makeCombatantWithStatusEffects(
  hp: number,
  blockValue: number,
  statusEffects: StatusEffect[],
): Combatant {
  const base = makeCombatant(hp, blockValue)
  return { ...base, statusEffects }
}

// ─────────────────────────────────────────────
// applyDamageToCharacter — ブロックなし
// ─────────────────────────────────────────────

describe('applyDamageToCharacter - ブロックなし', () => {
  it('ブロック0のとき全ダメージがHPに適用される', () => {
    const combatant = makeCombatant(50, 0)
    const result = applyDamageToCharacter(combatant, 10)
    expect(result.health.current).toBe(40)
    expect(result.block.value).toBe(0)
  })

  it('ダメージ0のときHPとブロックは変わらない', () => {
    const combatant = makeCombatant(50, 0)
    const result = applyDamageToCharacter(combatant, 0)
    expect(result.health.current).toBe(50)
    expect(result.block.value).toBe(0)
  })

  it('HPを超えるダメージでもHP は0以下にならない', () => {
    const combatant = makeCombatant(10, 0)
    const result = applyDamageToCharacter(combatant, 100)
    expect(result.health.current).toBe(0)
  })
})

// ─────────────────────────────────────────────
// applyDamageToCharacter — ブロック先行消費ルール
// ─────────────────────────────────────────────

describe('applyDamageToCharacter - ブロック先行消費ルール', () => {
  it('ブロックがダメージより大きいとき HPは減らずブロックだけ減る', () => {
    const combatant = makeCombatant(50, 20)
    const result = applyDamageToCharacter(combatant, 10)
    expect(result.health.current).toBe(50)
    expect(result.block.value).toBe(10)
  })

  it('ブロックがダメージより小さいとき残りダメージがHPに適用される', () => {
    const combatant = makeCombatant(50, 5)
    const result = applyDamageToCharacter(combatant, 10)
    expect(result.health.current).toBe(45)
    expect(result.block.value).toBe(0)
  })

  it('ブロックとダメージが等しいとき HPは減らずブロックは0になる', () => {
    const combatant = makeCombatant(50, 10)
    const result = applyDamageToCharacter(combatant, 10)
    expect(result.health.current).toBe(50)
    expect(result.block.value).toBe(0)
  })
})

// ─────────────────────────────────────────────
// applyDamageToCharacter — イミュータビリティ・型保持
// ─────────────────────────────────────────────

describe('applyDamageToCharacter - イミュータビリティ', () => {
  it('元のcombatantを変更しない', () => {
    const combatant = makeCombatant(50, 10)
    const originalHp = combatant.health.current
    applyDamageToCharacter(combatant, 10)
    expect(combatant.health.current).toBe(originalHp)
  })

  it('新しいオブジェクトを返す（元の参照とは異なる）', () => {
    const combatant = makeCombatant(50, 10)
    const result = applyDamageToCharacter(combatant, 10)
    expect(result).not.toBe(combatant)
  })

  it('ジェネリクスにより拡張フィールドが保持される', () => {
    const extended = { ...makeCombatant(50, 0), id: 'test_id', name: 'Test' }
    const result = applyDamageToCharacter(extended, 10)
    expect(result.id).toBe('test_id')
    expect(result.name).toBe('Test')
  })
})

// ─────────────────────────────────────────────
// calculateDamage — 正常系・同値クラス (AC2/AC3/AC5)
// ─────────────────────────────────────────────

describe('calculateDamage - 正常系（状態効果なし）', () => {
  it('観点01: 状態効果なしのとき baseAmount をそのまま返す', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(calculateDamage(10, attacker, target)).toBe(10)
  })

  it('観点02: baseAmount=0 のとき結果は 0 になる（境界値：最小正常値）', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(calculateDamage(0, attacker, target)).toBe(0)
  })

  it('観点04: baseAmount=6 のとき同値クラス中間値で期待値を返す', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(calculateDamage(6, attacker, target)).toBe(6)
  })

  it('観点28: 同一入力で複数回呼んでも同じ結果になる（冪等性）', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    const result1 = calculateDamage(10, attacker, target)
    const result2 = calculateDamage(10, attacker, target)
    expect(result1).toBe(result2)
  })
})

// ─────────────────────────────────────────────
// calculateDamage — AC2: 筋力バフ/デバフ
// ─────────────────────────────────────────────

describe('calculateDamage - AC2: 筋力バフ/デバフ（Strength）', () => {
  it('観点01: 正のStrength(stacks=3)のとき base+3 になる', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, 3, 0),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(6, attacker, target)).toBe(9)
  })

  it('観点01: 負のStrength(stacks=-2)のとき base-2 になる（デバフ）', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, -2, 0),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(6, attacker, target)).toBe(4)
  })

  it('観点02: Strength(stacks=0)のとき変化なし（境界値）', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, 0, 0),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(6, attacker, target)).toBe(6)
  })

  it('観点11: 元の attacker Combatant を変更しない（イミュータビリティ）', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, 5, 0),
    ])
    const target = makeCombatant(50, 0)
    const originalStacks = attacker.statusEffects[0]?.stacks
    calculateDamage(6, attacker, target)
    expect(attacker.statusEffects[0]?.stacks).toBe(originalStacks)
  })
})

// ─────────────────────────────────────────────
// calculateDamage — AC3: 脆弱（Vulnerable）
// ─────────────────────────────────────────────

describe('calculateDamage - AC3: 脆弱（Vulnerable）', () => {
  it('観点01: target が Vulnerable(duration=1) のとき ×1.5 floor になる', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 1),
    ])
    // floor(10 * 1.5) = 15
    expect(calculateDamage(10, attacker, target)).toBe(15)
  })

  it('観点01: floor 切り捨てが適用される（5 * 1.5 = 7.5 → 7）', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 2),
    ])
    expect(calculateDamage(5, attacker, target)).toBe(7)
  })

  it('観点02: target が Vulnerable(duration=0) のとき倍率なし', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 0),
    ])
    expect(calculateDamage(10, attacker, target)).toBe(10)
  })

  it('観点16: Vulnerable なし vs あり の組み合わせで差異が出る', () => {
    const attacker = makeCombatant(80, 0)
    const normalTarget = makeCombatant(50, 0)
    const vulnerableTarget = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 1),
    ])
    const dmgNormal = calculateDamage(10, attacker, normalTarget)
    const dmgVulnerable = calculateDamage(10, attacker, vulnerableTarget)
    expect(dmgVulnerable).toBeGreaterThan(dmgNormal)
  })
})

// ─────────────────────────────────────────────
// calculateDamage — AC5: 弱体化（Weak）
// ─────────────────────────────────────────────

describe('calculateDamage - AC5: 弱体化（Weak）', () => {
  it('観点01: attacker が Weak(duration=1) のとき ×0.75 floor になる', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Weak, 0, 1),
    ])
    const target = makeCombatant(50, 0)
    // floor(10 * 0.75) = 7
    expect(calculateDamage(10, attacker, target)).toBe(7)
  })

  it('観点01: floor 切り捨てが適用される（6 * 0.75 = 4.5 → 4）', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Weak, 0, 2),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(6, attacker, target)).toBe(4)
  })

  it('観点02: attacker が Weak(duration=0) のとき倍率なし', () => {
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Weak, 0, 0),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(10, attacker, target)).toBe(10)
  })
})

// ─────────────────────────────────────────────
// calculateDamage — AC2+AC3+AC5: 複合条件（決定表）
// ─────────────────────────────────────────────

describe('calculateDamage - 複合条件（決定表）', () => {
  it('観点16: Strength+3 かつ Vulnerable(target) のとき正しく計算される', () => {
    // base=10, +3 strength → 13, vulnerable ×1.5 floor → floor(13 * 1.5) = 19
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, 3, 0),
    ])
    const target = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 1),
    ])
    expect(calculateDamage(10, attacker, target)).toBe(19)
  })

  it('観点16: Weak(attacker) かつ Vulnerable(target) のとき正しく計算される', () => {
    // base=10, weak ×0.75 floor → 7, vulnerable ×1.5 floor → floor(7 * 1.5) = 10
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Weak, 0, 1),
    ])
    const target = makeCombatantWithStatusEffects(50, 0, [
      makeStatusEffect(StatusEffectType.Vulnerable, 0, 1),
    ])
    expect(calculateDamage(10, attacker, target)).toBe(10)
  })

  it('観点16: Strength+3 かつ Weak(attacker) のとき正しく計算される', () => {
    // base=10, +3 strength → 13, weak ×0.75 floor → floor(13 * 0.75) = 9
    const attacker = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Strength, 3, 0),
      makeStatusEffect(StatusEffectType.Weak, 0, 1),
    ])
    const target = makeCombatant(50, 0)
    expect(calculateDamage(10, attacker, target)).toBe(9)
  })

  it('観点16: 全効果なしのとき baseAmount をそのまま返す', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(calculateDamage(10, attacker, target)).toBe(10)
  })
})

// ─────────────────────────────────────────────
// calculateDamage — 特殊数値（NaN / Infinity）
// ─────────────────────────────────────────────

describe('calculateDamage - 特殊数値（観点07）', () => {
  it('baseAmount が NaN のときエラーを投げる', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(() => calculateDamage(NaN, attacker, target)).toThrow()
  })

  it('baseAmount が Infinity のときエラーまたはフォールバック値を返す', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(() => calculateDamage(Infinity, attacker, target)).toThrow()
  })

  it('baseAmount が負の数のときエラーを投げる（観点05）', () => {
    const attacker = makeCombatant(80, 0)
    const target = makeCombatant(50, 0)
    expect(() => calculateDamage(-1, attacker, target)).toThrow(
      /calculateDamage: baseAmount must be a non-negative finite number/,
    )
  })
})

// ─────────────────────────────────────────────
// calculateBlock — 正常系（AC6）
// ─────────────────────────────────────────────

describe('calculateBlock - 正常系（状態効果なし）', () => {
  it('観点01: 状態効果なしのとき baseAmount をそのまま返す', () => {
    const defender = makeCombatant(80, 0)
    expect(calculateBlock(5, defender)).toBe(5)
  })

  it('観点02: baseAmount=0 のとき結果は 0 になる（境界値：最小正常値）', () => {
    const defender = makeCombatant(80, 0)
    expect(calculateBlock(0, defender)).toBe(0)
  })

  it('観点28: 同一入力で複数回呼んでも同じ結果になる（冪等性）', () => {
    const defender = makeCombatant(80, 0)
    expect(calculateBlock(5, defender)).toBe(calculateBlock(5, defender))
  })
})

// ─────────────────────────────────────────────
// calculateBlock — AC6: 俊敏（Dexterity）
// ─────────────────────────────────────────────

describe('calculateBlock - AC6: 俊敏（Dexterity）', () => {
  it('観点01: 正の Dexterity(stacks=2) のとき base+2 になる', () => {
    const defender = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Dexterity, 2, 0),
    ])
    expect(calculateBlock(5, defender)).toBe(7)
  })

  it('観点01: 負の Dexterity(stacks=-3) のとき base-3 になる（デバフ）', () => {
    const defender = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Dexterity, -3, 0),
    ])
    expect(calculateBlock(5, defender)).toBe(2)
  })

  it('観点02: Dexterity(stacks=0) のとき変化なし（境界値）', () => {
    const defender = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Dexterity, 0, 0),
    ])
    expect(calculateBlock(5, defender)).toBe(5)
  })

  it('観点01: Dexterity デバフで結果が 0 未満にならない（最小値 0 保証）', () => {
    const defender = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Dexterity, -10, 0),
    ])
    expect(calculateBlock(3, defender)).toBe(0)
  })

  it('観点11: 元の defender Combatant を変更しない（イミュータビリティ）', () => {
    const defender = makeCombatantWithStatusEffects(80, 0, [
      makeStatusEffect(StatusEffectType.Dexterity, 2, 0),
    ])
    const originalStacks = defender.statusEffects[0]?.stacks
    calculateBlock(5, defender)
    expect(defender.statusEffects[0]?.stacks).toBe(originalStacks)
  })
})

// ─────────────────────────────────────────────
// calculateBlock — 特殊数値（NaN / Infinity）
// ─────────────────────────────────────────────

describe('calculateBlock - 特殊数値（観点07）', () => {
  it('baseAmount が NaN のときエラーまたはフォールバック値を返す', () => {
    const defender = makeCombatant(80, 0)
    expect(() => calculateBlock(NaN, defender)).toThrow()
  })

  it('baseAmount が Infinity のときエラーまたはフォールバック値を返す', () => {
    const defender = makeCombatant(80, 0)
    expect(() => calculateBlock(Infinity, defender)).toThrow()
  })

  it('baseAmount が負の数のときエラーを投げる（観点05）', () => {
    const defender = makeCombatant(80, 0)
    expect(() => calculateBlock(-1, defender)).toThrow(
      /calculateBlock: baseAmount must be a non-negative finite number/,
    )
  })
})
