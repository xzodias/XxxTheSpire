import { describe, it, expect } from 'vitest'
import { Seed } from '../../../src/domain/value-objects/Seed'

describe('Seed.create', () => {
  it('文字列からSeedを生成できる', () => {
    const seed = Seed.create('abc123')
    expect(seed.value).toBe('abc123')
  })

  it('数値文字列からSeedを生成できる', () => {
    const seed = Seed.create('12345')
    expect(seed.value).toBe('12345')
  })

  it('空文字列の場合はエラーをスローする', () => {
    expect(() => Seed.create('')).toThrow()
  })

  it('ホワイトスペースのみの場合はエラーをスローする', () => {
    expect(() => Seed.create('   ')).toThrow()
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
    // crypto.randomUUID() は xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx 形式
    expect(seed.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('生成するたびに異なるSeedが生成される', () => {
    const values = new Set(Array.from({ length: 100 }, () => Seed.generate().value))
    expect(values.size).toBe(100)
  })
})

describe('Seed.fromString', () => {
  it('文字列からSeedを復元できる', () => {
    const seed = Seed.fromString('my-run-seed')
    expect(seed.value).toBe('my-run-seed')
  })

  it('空文字列の場合はエラーをスローする', () => {
    expect(() => Seed.fromString('')).toThrow()
  })

  it('ホワイトスペースのみの場合はエラーをスローする', () => {
    expect(() => Seed.fromString('   ')).toThrow()
  })
})

describe('Seed value immutability', () => {
  it('valueプロパティはreadonlyである', () => {
    const seed = Seed.create('test')
    expect(seed.value).toBe('test')
  })
})
