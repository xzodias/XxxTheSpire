import { describe, it, expect } from 'vitest'
import { Health } from '../../../src/domain/value-objects/Health'

describe('Health.create', () => {
  it('正常な値でHealthを生成できる', () => {
    const result = Health.create(50, 100)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.current).toBe(50)
      expect(result.value.max).toBe(100)
    }
  })

  it('current === max でも生成できる', () => {
    const result = Health.create(100, 100)
    expect(result.ok).toBe(true)
  })

  it('current === 0 でも生成できる（死亡状態）', () => {
    const result = Health.create(0, 100)
    expect(result.ok).toBe(true)
  })

  it('current が負の値の場合はエラーメッセージを返す', () => {
    const result = Health.create(-1, 100)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('current must be 0 or greater')
  })

  it('max が 0 の場合はエラーメッセージを返す', () => {
    const result = Health.create(0, 0)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('max must be greater than 0')
  })

  it('max が負の値の場合はエラーメッセージを返す', () => {
    const result = Health.create(0, -10)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('max must be greater than 0')
  })

  it('current が max を超える場合はエラーメッセージを返す', () => {
    const result = Health.create(101, 100)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('current must not exceed max')
  })
})

describe('Health#takeDamage', () => {
  it('ダメージを受けて current が減る', () => {
    const health = Health.create(100, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(30)
    expect(damaged.current).toBe(70)
    expect(damaged.max).toBe(100)
  })

  it('ダメージが current を超えても 0 未満にならない', () => {
    const health = Health.create(10, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(50)
    expect(damaged.current).toBe(0)
  })

  it('ダメージ 0 は変化しない', () => {
    const health = Health.create(80, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(0)
    expect(damaged.current).toBe(80)
  })

  it('死亡状態のエンティティにダメージを与えても current は 0 のまま', () => {
    const health = Health.create(0, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(50)
    expect(damaged.current).toBe(0)
  })

  it('負のダメージは 0 として扱う', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(-10)
    expect(damaged.current).toBe(50)
  })

  it('NaN のダメージは 0 として扱う', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(NaN)
    expect(damaged.current).toBe(50)
  })

  it('Infinity のダメージは 0 として扱う', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const damaged = health.value.takeDamage(Infinity)
    expect(damaged.current).toBe(50)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const health = Health.create(100, 100)
    if (!health.ok) throw new Error('setup failed')
    health.value.takeDamage(50)
    expect(health.value.current).toBe(100)
  })
})

describe('Health#heal', () => {
  it('回復して current が増える', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(20)
    expect(healed.current).toBe(70)
    expect(healed.max).toBe(100)
  })

  it('回復量が max を超えても max を超えない', () => {
    const health = Health.create(90, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(50)
    expect(healed.current).toBe(100)
  })

  it('回復 0 は変化しない', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(0)
    expect(healed.current).toBe(50)
  })

  it('死亡状態から回復できる', () => {
    const health = Health.create(0, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(30)
    expect(healed.current).toBe(30)
    expect(healed.isDead()).toBe(false)
  })

  it('負の回復量は 0 として扱う', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(-10)
    expect(healed.current).toBe(50)
  })

  it('NaN の回復量は 0 として扱う', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    const healed = health.value.heal(NaN)
    expect(healed.current).toBe(50)
  })

  it('元のオブジェクトは変更されない（イミュータブル）', () => {
    const health = Health.create(50, 100)
    if (!health.ok) throw new Error('setup failed')
    health.value.heal(50)
    expect(health.value.current).toBe(50)
  })
})

describe('Health#isDead', () => {
  it('current === 0 のとき true', () => {
    const health = Health.create(0, 100)
    if (!health.ok) throw new Error('setup failed')
    expect(health.value.isDead()).toBe(true)
  })

  it('current > 0 のとき false', () => {
    const health = Health.create(1, 100)
    if (!health.ok) throw new Error('setup failed')
    expect(health.value.isDead()).toBe(false)
  })

  it('current === max（フル体力）のとき false', () => {
    const health = Health.create(100, 100)
    if (!health.ok) throw new Error('setup failed')
    expect(health.value.isDead()).toBe(false)
  })
})
