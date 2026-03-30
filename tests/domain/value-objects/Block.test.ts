import { describe, it, expect } from 'vitest'
import { Block } from '../../../src/domain/value-objects/Block'

describe('Block.create', () => {
  it('正常な値でBlockを生成できる', () => {
    const result = Block.create(5)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.value).toBe(5)
  })

  it('value === 0 でも生成できる', () => {
    const result = Block.create(0)
    expect(result.ok).toBe(true)
  })

  it('負の値の場合はエラーを返す', () => {
    const result = Block.create(-1)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Block value must be 0 or greater')
  })

  it('NaN の場合はエラーを返す', () => {
    const result = Block.create(NaN)
    expect(result.ok).toBe(false)
  })

  it('Infinity の場合はエラーを返す', () => {
    const result = Block.create(Infinity)
    expect(result.ok).toBe(false)
  })
})

describe('Block#absorb', () => {
  it('ダメージをブロックで吸収する', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const { block: remaining, remainingDamage } = block.value.absorb(3)
    expect(remaining.value).toBe(2)
    expect(remainingDamage).toBe(0)
  })

  it('ダメージがブロックを超えた場合は残りダメージが発生する', () => {
    const block = Block.create(3)
    if (!block.ok) throw new Error('setup failed')
    const { block: remaining, remainingDamage } = block.value.absorb(7)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(4)
  })

  it('ダメージとブロックが同値の場合はブロック0・残りダメージ0', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const { block: remaining, remainingDamage } = block.value.absorb(5)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(0)
  })

  it('ダメージ 0 はブロック変化なし', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const { block: remaining, remainingDamage } = block.value.absorb(0)
    expect(remaining.value).toBe(5)
    expect(remainingDamage).toBe(0)
  })

  it('ブロック 0 の場合は全ダメージが残る', () => {
    const block = Block.create(0)
    if (!block.ok) throw new Error('setup failed')
    const { block: remaining, remainingDamage } = block.value.absorb(10)
    expect(remaining.value).toBe(0)
    expect(remainingDamage).toBe(10)
  })

  it('負のダメージの場合はエラーをスローする（プログラマーのバグ）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    expect(() => block.value.absorb(-5)).toThrow()
  })

  it('NaN のダメージの場合はエラーをスローする（プログラマーのバグ）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    expect(() => block.value.absorb(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    block.value.absorb(3)
    expect(block.value.value).toBe(5)
  })
})

describe('Block#add', () => {
  it('ブロック値が加算される', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const result = block.value.add(3)
    expect(result.value).toBe(8)
  })

  it('0 加算は変化しない', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const result = block.value.add(0)
    expect(result.value).toBe(5)
  })

  it('負の値の場合はエラーをスローする（プログラマーのバグ）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    expect(() => block.value.add(-3)).toThrow()
  })

  it('NaN の場合はエラーをスローする（プログラマーのバグ）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    expect(() => block.value.add(NaN)).toThrow()
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    block.value.add(3)
    expect(block.value.value).toBe(5)
  })
})

describe('Block#reset', () => {
  it('ターン終了時にブロックが0にリセットされる', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    const result = block.value.reset()
    expect(result.value).toBe(0)
  })

  it('すでに0のブロックをリセットしても0のまま', () => {
    const block = Block.create(0)
    if (!block.ok) throw new Error('setup failed')
    const result = block.value.reset()
    expect(result.value).toBe(0)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const block = Block.create(5)
    if (!block.ok) throw new Error('setup failed')
    block.value.reset()
    expect(block.value.value).toBe(5)
  })
})
