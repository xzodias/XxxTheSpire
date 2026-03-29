import { describe, it, expect } from 'vitest'
import { Energy } from '../../../src/domain/value-objects/Energy'

describe('Energy.create', () => {
  it('正常な値でEnergyを生成できる', () => {
    const result = Energy.create(3, 3)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.current).toBe(3)
      expect(result.value.max).toBe(3)
    }
  })

  it('current が max 未満でも生成できる', () => {
    const result = Energy.create(1, 3)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.current).toBe(1)
      expect(result.value.max).toBe(3)
    }
  })

  it('current === 0 でも生成できる', () => {
    const result = Energy.create(0, 3)
    expect(result.ok).toBe(true)
  })

  it('current が負の値の場合はエラーを返す', () => {
    const result = Energy.create(-1, 3)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('current must be 0 or greater')
  })

  it('max が 0 以下の場合はエラーを返す', () => {
    const result = Energy.create(0, 0)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('max must be greater than 0')
  })

  it('current が max を超える場合はエラーを返す', () => {
    const result = Energy.create(4, 3)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('current must not exceed max')
  })

  it('NaN の場合はエラーを返す', () => {
    const result = Energy.create(NaN, 3)
    expect(result.ok).toBe(false)
  })

  it('Infinity の場合はエラーを返す', () => {
    const result = Energy.create(Infinity, 3)
    expect(result.ok).toBe(false)
  })
})

describe('Energy#spend', () => {
  it('コストを消費してエネルギーが減る', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.spend(2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.current).toBe(1)
      expect(result.value.max).toBe(3)
    }
  })

  it('ちょうど全消費できる', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.spend(3)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.current).toBe(0)
  })

  it('エネルギーが不足している場合はエラーを返す', () => {
    const energy = Energy.create(1, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.spend(2)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('not enough energy')
  })

  it('消費量 0 は変化しない', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.spend(0)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.current).toBe(3)
  })

  it('負のコストの場合はエラーをスローする（プログラマーのバグ）', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(() => energy.value.spend(-1)).toThrow()
  })

  it('NaN のコストの場合はエラーをスローする（プログラマーのバグ）', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(() => energy.value.spend(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    energy.value.spend(2)
    expect(energy.value.current).toBe(3)
  })
})

describe('Energy#refill', () => {
  it('maxまでエネルギーが回復する', () => {
    const energy = Energy.create(1, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.refill()
    expect(result.current).toBe(3)
    expect(result.max).toBe(3)
  })

  it('すでにmaxの場合は変化しない', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    const result = energy.value.refill()
    expect(result.current).toBe(3)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const energy = Energy.create(1, 3)
    if (!energy.ok) throw new Error('setup failed')
    energy.value.refill()
    expect(energy.value.current).toBe(1)
  })
})

describe('Energy#canAfford', () => {
  it('コストがcurrent以下の場合はtrueを返す', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(2)).toBe(true)
  })

  it('コストがcurrentと同じ場合はtrueを返す', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(3)).toBe(true)
  })

  it('コストがcurrentを超える場合はfalseを返す', () => {
    const energy = Energy.create(1, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(2)).toBe(false)
  })

  it('コスト 0 は常にtrueを返す', () => {
    const energy = Energy.create(0, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(0)).toBe(true)
  })

  it('負のコストの場合はfalseを返す', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(-1)).toBe(false)
  })

  it('NaN のコストの場合はfalseを返す', () => {
    const energy = Energy.create(3, 3)
    if (!energy.ok) throw new Error('setup failed')
    expect(energy.value.canAfford(NaN)).toBe(false)
  })
})
