import { describe, it, expect } from 'vitest'
import { Gold } from '../../../src/domain/value-objects/Gold'

describe('Gold.create', () => {
  it('正常な値でGoldを生成できる', () => {
    const gold = Gold.create(100)
    expect(gold.amount).toBe(100)
  })

  it('amount === 0 でも生成できる', () => {
    const gold = Gold.create(0)
    expect(gold.amount).toBe(0)
  })

  it('負の値の場合はエラーをスローする', () => {
    expect(() => Gold.create(-1)).toThrow()
  })
})

describe('Gold#add', () => {
  it('ゴールドが増加する', () => {
    const gold = Gold.create(50)
    const result = gold.add(30)
    expect(result.amount).toBe(80)
  })

  it('0 加算は変化しない', () => {
    const gold = Gold.create(50)
    const result = gold.add(0)
    expect(result.amount).toBe(50)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const gold = Gold.create(50)
    gold.add(30)
    expect(gold.amount).toBe(50)
  })
})

describe('Gold#spend', () => {
  it('ゴールドを消費して残高が減る', () => {
    const gold = Gold.create(100)
    const result = gold.spend(30)
    expect(result.amount).toBe(70)
  })

  it('ちょうど全額消費できる', () => {
    const gold = Gold.create(100)
    const result = gold.spend(100)
    expect(result.amount).toBe(0)
  })

  it('残高不足の場合はエラーをスローする', () => {
    const gold = Gold.create(50)
    expect(() => gold.spend(100)).toThrow()
  })

  it('消費量 0 は変化しない', () => {
    const gold = Gold.create(50)
    const result = gold.spend(0)
    expect(result.amount).toBe(50)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const gold = Gold.create(100)
    gold.spend(30)
    expect(gold.amount).toBe(100)
  })
})

describe('Gold#canAfford', () => {
  it('価格がamount以下の場合はtrueを返す', () => {
    const gold = Gold.create(100)
    expect(gold.canAfford(80)).toBe(true)
  })

  it('価格とamountが同じ場合はtrueを返す', () => {
    const gold = Gold.create(100)
    expect(gold.canAfford(100)).toBe(true)
  })

  it('価格がamountを超える場合はfalseを返す', () => {
    const gold = Gold.create(50)
    expect(gold.canAfford(100)).toBe(false)
  })

  it('価格 0 は常にtrueを返す', () => {
    const gold = Gold.create(0)
    expect(gold.canAfford(0)).toBe(true)
  })
})
