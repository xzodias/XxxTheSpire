import { describe, it, expect } from 'vitest'
import { applyDamageToCharacter } from '../../../src/domain/rules/CombatRules'
import { type Combatant } from '../../../src/domain/entities/Character'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'

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
