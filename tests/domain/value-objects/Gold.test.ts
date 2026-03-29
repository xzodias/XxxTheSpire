import { describe, it, expect } from 'vitest'
import { Gold } from '../../../src/domain/value-objects/Gold'

describe('Gold.create', () => {
  it('正常な値でGoldを生成できる', () => {
    const result = Gold.create(100)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.amount).toBe(100)
  })

  it('amount === 0 でも生成できる', () => {
    const result = Gold.create(0)
    expect(result.ok).toBe(true)
  })

  it('負の値の場合はエラーを返す', () => {
    const result = Gold.create(-1)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Gold amount must be 0 or greater')
  })

  it('NaN の場合はエラーを返す', () => {
    const result = Gold.create(NaN)
    expect(result.ok).toBe(false)
  })

  it('Infinity の場合はエラーを返す', () => {
    const result = Gold.create(Infinity)
    expect(result.ok).toBe(false)
  })
})

describe('Gold#add', () => {
  it('ゴールドが増加する', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.add(30)
    expect(result.amount).toBe(80)
  })

  it('0 加算は変化しない', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.add(0)
    expect(result.amount).toBe(50)
  })

  it('負の値の場合はエラーをスローする（プログラマーのバグ）', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    expect(() => gold.value.add(-10)).toThrow()
  })

  it('NaN の場合はエラーをスローする（プログラマーのバグ）', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    expect(() => gold.value.add(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    gold.value.add(30)
    expect(gold.value.amount).toBe(50)
  })
})

describe('Gold#spend', () => {
  it('ゴールドを消費して残高が減る', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.spend(30)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.amount).toBe(70)
  })

  it('ちょうど全額消費できる', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.spend(100)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.amount).toBe(0)
  })

  it('残高不足の場合はエラーを返す', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.spend(100)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('not enough gold')
  })

  it('消費量 0 は変化しない', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    const result = gold.value.spend(0)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.amount).toBe(50)
  })

  it('負の値の場合はエラーをスローする（プログラマーのバグ）', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(() => gold.value.spend(-10)).toThrow()
  })

  it('NaN の場合はエラーをスローする（プログラマーのバグ）', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(() => gold.value.spend(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    gold.value.spend(30)
    expect(gold.value.amount).toBe(100)
  })
})

describe('Gold#canAfford', () => {
  it('価格がamount以下の場合はtrueを返す', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(80)).toBe(true)
  })

  it('価格とamountが同じ場合はtrueを返す', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(100)).toBe(true)
  })

  it('価格がamountを超える場合はfalseを返す', () => {
    const gold = Gold.create(50)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(100)).toBe(false)
  })

  it('価格 0 は常にtrueを返す', () => {
    const gold = Gold.create(0)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(0)).toBe(true)
  })

  it('負の価格の場合はfalseを返す', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(-1)).toBe(false)
  })

  it('NaN の場合はfalseを返す', () => {
    const gold = Gold.create(100)
    if (!gold.ok) throw new Error('setup failed')
    expect(gold.value.canAfford(NaN)).toBe(false)
  })
})
