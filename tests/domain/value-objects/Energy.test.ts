import { describe, it, expect } from 'vitest'
import { Energy } from '../../../src/domain/value-objects/Energy'

describe('Energy.create', () => {
  it('正常な値でEnergyを生成できる', () => {
    const energy = Energy.create(3, 3)
    expect(energy.current).toBe(3)
    expect(energy.max).toBe(3)
  })

  it('current が max 未満でも生成できる', () => {
    const energy = Energy.create(1, 3)
    expect(energy.current).toBe(1)
    expect(energy.max).toBe(3)
  })

  it('current === 0 でも生成できる', () => {
    const energy = Energy.create(0, 3)
    expect(energy.current).toBe(0)
  })

  it('current が負の値の場合はエラーをスローする', () => {
    expect(() => Energy.create(-1, 3)).toThrow()
  })

  it('max が 0 以下の場合はエラーをスローする', () => {
    expect(() => Energy.create(0, 0)).toThrow()
  })

  it('current が max を超える場合はエラーをスローする', () => {
    expect(() => Energy.create(4, 3)).toThrow()
  })

  it('NaN の場合はエラーをスローする', () => {
    expect(() => Energy.create(NaN, 3)).toThrow()
    expect(() => Energy.create(3, NaN)).toThrow()
  })

  it('Infinity の場合はエラーをスローする', () => {
    expect(() => Energy.create(Infinity, 3)).toThrow()
    expect(() => Energy.create(3, Infinity)).toThrow()
  })
})

describe('Energy#spend', () => {
  it('コストを消費してエネルギーが減る', () => {
    const energy = Energy.create(3, 3)
    const result = energy.spend(2)
    expect(result.current).toBe(1)
    expect(result.max).toBe(3)
  })

  it('ちょうど全消費できる', () => {
    const energy = Energy.create(3, 3)
    const result = energy.spend(3)
    expect(result.current).toBe(0)
  })

  it('エネルギーが不足している場合はエラーをスローする', () => {
    const energy = Energy.create(1, 3)
    expect(() => energy.spend(2)).toThrow()
  })

  it('消費量 0 は変化しない', () => {
    const energy = Energy.create(3, 3)
    const result = energy.spend(0)
    expect(result.current).toBe(3)
  })

  it('負のコストの場合はエラーをスローする', () => {
    const energy = Energy.create(3, 3)
    expect(() => energy.spend(-1)).toThrow()
  })

  it('NaN のコストの場合はエラーをスローする', () => {
    const energy = Energy.create(3, 3)
    expect(() => energy.spend(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const energy = Energy.create(3, 3)
    energy.spend(2)
    expect(energy.current).toBe(3)
  })
})

describe('Energy#refill', () => {
  it('maxまでエネルギーが回復する', () => {
    const energy = Energy.create(1, 3)
    const result = energy.refill()
    expect(result.current).toBe(3)
    expect(result.max).toBe(3)
  })

  it('すでにmaxの場合は変化しない', () => {
    const energy = Energy.create(3, 3)
    const result = energy.refill()
    expect(result.current).toBe(3)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const energy = Energy.create(1, 3)
    energy.refill()
    expect(energy.current).toBe(1)
  })
})

describe('Energy#canAfford', () => {
  it('コストがcurrent以下の場合はtrueを返す', () => {
    const energy = Energy.create(3, 3)
    expect(energy.canAfford(2)).toBe(true)
  })

  it('コストがcurrentと同じ場合はtrueを返す', () => {
    const energy = Energy.create(3, 3)
    expect(energy.canAfford(3)).toBe(true)
  })

  it('コストがcurrentを超える場合はfalseを返す', () => {
    const energy = Energy.create(1, 3)
    expect(energy.canAfford(2)).toBe(false)
  })

  it('コスト 0 は常にtrueを返す', () => {
    const energy = Energy.create(0, 3)
    expect(energy.canAfford(0)).toBe(true)
  })

  it('負のコストの場合はfalseを返す', () => {
    const energy = Energy.create(3, 3)
    expect(energy.canAfford(-1)).toBe(false)
  })

  it('NaN のコストの場合はfalseを返す', () => {
    const energy = Energy.create(3, 3)
    expect(energy.canAfford(NaN)).toBe(false)
  })
})
