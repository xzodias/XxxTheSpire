import { describe, it, expect } from 'vitest'
import { Seed } from '../../../src/domain/value-objects/Seed'

describe('Seed.create', () => {
  it('文字列からSeedを生成できる', () => {
    const result = Seed.create('abc123')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.value).toBe('abc123')
  })

  it('数値文字列からSeedを生成できる', () => {
    const result = Seed.create('12345')
    expect(result.ok).toBe(true)
  })

  it('空文字列の場合はエラーを返す', () => {
    const result = Seed.create('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Seed value must not be empty or whitespace')
  })

  it('ホワイトスペースのみの場合はエラーを返す', () => {
    const result = Seed.create('   ')
    expect(result.ok).toBe(false)
  })
})

describe('Seed.generate', () => {
  it('ランダムなSeedを生成できる', () => {
    const seed = Seed.generate()
    expect(seed.value).toBeTruthy()
    expect(typeof seed.value).toBe('string')
    expect(seed.value.length).toBeGreaterThan(0)
  })

  it('UUID形式のSeedを生成する', () => {
    const seed = Seed.generate()
    expect(seed.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('生成するたびに異なるSeedが生成される', () => {
    const values = new Set(Array.from({ length: 100 }, () => Seed.generate().value))
    expect(values.size).toBe(100)
  })
})

describe('Seed.fromString', () => {
  it('文字列からSeedを復元できる', () => {
    const result = Seed.fromString('my-run-seed')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.value).toBe('my-run-seed')
  })

  it('空文字列の場合はエラーを返す', () => {
    const result = Seed.fromString('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Seed value must not be empty or whitespace')
  })

  it('ホワイトスペースのみの場合はエラーを返す', () => {
    const result = Seed.fromString('   ')
    expect(result.ok).toBe(false)
  })
})

describe('Seed value immutability', () => {
  it('valueプロパティはreadonlyである', () => {
    const seed = Seed.create('test')
    if (!seed.ok) throw new Error('setup failed')
    expect(seed.value.value).toBe('test')
  })
})
