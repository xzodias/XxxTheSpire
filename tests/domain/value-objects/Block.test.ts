import { describe, it, expect } from 'vitest'
import { Block } from '../../../src/domain/value-objects/Block'

describe('Block.create', () => {
  it('正常な値でBlockを生成できる', () => {
    const block = Block.create(5)
    expect(block.value).toBe(5)
  })

  it('value === 0 でも生成できる', () => {
    const block = Block.create(0)
    expect(block.value).toBe(0)
  })

  it('負の値の場合はエラーをスローする', () => {
    expect(() => Block.create(-1)).toThrow()
  })

  it('NaN の場合はエラーをスローする', () => {
    expect(() => Block.create(NaN)).toThrow()
  })

  it('Infinity の場合はエラーをスローする', () => {
    expect(() => Block.create(Infinity)).toThrow()
  })
})

describe('Block#absorb', () => {
  it('ダメージをブロックで吸収する', () => {
    const block = Block.create(5)
    const { block: remaining, remainingDamage } = block.absorb(3)
    expect(remaining.value).toBe(2)
    expect(remainingDamage).toBe(0)
  })

  it('ダメージがブロックを超えた場合は残りダメージが発生する', () => {
    const block = Block.create(3)
    const { block: remaining, remainingDamage } = block.absorb(7)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(4)
  })

  it('ダメージとブロックが同値の場合はブロック0・残りダメージ0', () => {
    const block = Block.create(5)
    const { block: remaining, remainingDamage } = block.absorb(5)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(0)
  })

  it('ダメージ 0 はブロック変化なし', () => {
    const block = Block.create(5)
    const { block: remaining, remainingDamage } = block.absorb(0)
    expect(remaining.value).toBe(5)
    expect(remainingDamage).toBe(0)
  })

  it('ブロック 0 の場合は全ダメージが残る', () => {
    const block = Block.create(0)
    const { block: remaining, remainingDamage } = block.absorb(10)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(10)
  })

  it('負のダメージの場合はエラーをスローする', () => {
    const block = Block.create(5)
    expect(() => block.absorb(-5)).toThrow()
  })

  it('NaN のダメージの場合はエラーをスローする', () => {
    const block = Block.create(5)
    expect(() => block.absorb(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    block.absorb(3)
    expect(block.value).toBe(5)
  })
})

describe('Block#add', () => {
  it('ブロック値が加算される', () => {
    const block = Block.create(5)
    const result = block.add(3)
    expect(result.value).toBe(8)
  })

  it('0 加算は変化しない', () => {
    const block = Block.create(5)
    const result = block.add(0)
    expect(result.value).toBe(5)
  })

  it('負の値の場合はエラーをスローする', () => {
    const block = Block.create(5)
    expect(() => block.add(-3)).toThrow()
  })

  it('NaN の場合はエラーをスローする', () => {
    const block = Block.create(5)
    expect(() => block.add(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    block.add(3)
    expect(block.value).toBe(5)
  })
})

describe('Block#reset', () => {
  it('ターン終了時にブロックが0にリセットされる', () => {
    const block = Block.create(5)
    const result = block.reset()
    expect(result.value).toBe(0)
  })

  it('すでに0のブロックをリセットしても0のまま', () => {
    const block = Block.create(0)
    const result = block.reset()
    expect(result.value).toBe(0)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    block.reset()
    expect(block.value).toBe(5)
  })
})
