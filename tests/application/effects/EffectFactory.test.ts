import { describe, it, expect } from 'vitest'
import { EffectFactory } from '../../../src/application/effects/EffectFactory'
import { DamageEffect } from '../../../src/application/effects/DamageEffect'
import { BlockEffect } from '../../../src/application/effects/BlockEffect'
import { DrawEffect } from '../../../src/application/effects/DrawEffect'
import { type EffectDef } from '../../../src/shared/types'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeEffectDef(overrides: Partial<EffectDef> & { type: string; value: number }): EffectDef {
  return {
    type: overrides.type,
    value: overrides.value,
    target: overrides.target,
  }
}

// ─────────────────────────────────────────────
// EffectFactory — 基本動作 (AC5, 観点26)
// ─────────────────────────────────────────────

describe('EffectFactory - 基本動作', () => {
  it('空の EffectDef[] から ok([]) が返る', () => {
    const result = EffectFactory.build([])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(0)
  })

  it('単一の damage EffectDef から DamageEffect が生成される', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'damage', value: 6 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]).toBeInstanceOf(DamageEffect)
    }
  })

  it('単一の block EffectDef から BlockEffect が生成される', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'block', value: 5 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]).toBeInstanceOf(BlockEffect)
    }
  })

  it('単一の draw EffectDef から DrawEffect が生成される', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'draw', value: 2 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0]).toBeInstanceOf(DrawEffect)
    }
  })
})

// ─────────────────────────────────────────────
// EffectFactory — 複数エフェクト (AC2)
// ─────────────────────────────────────────────

describe('EffectFactory - 複数エフェクト', () => {
  it('複数の EffectDef から複数の Effect が正しい順序で生成される', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'damage', value: 8 }),
      makeEffectDef({ type: 'block', value: 5 }),
    ]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]).toBeInstanceOf(DamageEffect)
      expect(result.value[1]).toBeInstanceOf(BlockEffect)
    }
  })

  it('damage + draw の EffectDef から対応するエフェクトが順番通りに生成される', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'damage', value: 6 }),
      makeEffectDef({ type: 'draw', value: 1 }),
    ]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]).toBeInstanceOf(DamageEffect)
      expect(result.value[1]).toBeInstanceOf(DrawEffect)
    }
  })

  it('3つの EffectDef から3つの Effect が生成される', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'damage', value: 5 }),
      makeEffectDef({ type: 'block', value: 3 }),
      makeEffectDef({ type: 'draw', value: 1 }),
    ]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toHaveLength(3)
  })
})

// ─────────────────────────────────────────────
// EffectFactory — 未知のエフェクトタイプはエラーを返す (AC3, 観点27)
// ─────────────────────────────────────────────

describe('EffectFactory - 未知のエフェクトタイプ（AC3: err を返す）', () => {
  it('未知のタイプのみの場合は err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'unknown_effect', value: 10 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toHaveLength(1)
      expect(result.error[0]).toContain('unknown_effect')
    }
  })

  it('未知のタイプが混在するとき err を返す（エラーに未知タイプの情報が含まれる）', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'damage', value: 6 }),
      makeEffectDef({ type: 'unknown_effect', value: 99 }),
      makeEffectDef({ type: 'block', value: 5 }),
    ]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error[0]).toContain('unknown_effect')
  })

  it('全て未知のタイプのとき err を返す（エラー数が def 数と一致）', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'fire', value: 10 }),
      makeEffectDef({ type: 'ice', value: 5 }),
    ]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toHaveLength(2)
  })

  it('空文字タイプは err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: '', value: 5 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(false)
  })
})

// ─────────────────────────────────────────────
// EffectFactory — 不正なデータでシステムがクラッシュしない (AC3)
// ─────────────────────────────────────────────

describe('EffectFactory - 不正データ耐性（AC3: err を返す）', () => {
  it('value が負の damage def は err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'damage', value: -5 })]

    expect(() => EffectFactory.build(defs)).not.toThrow()
    const result = EffectFactory.build(defs)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error[0]).toContain('damage')
  })

  it('value が負の block def は err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'block', value: -3 })]

    expect(() => EffectFactory.build(defs)).not.toThrow()
    const result = EffectFactory.build(defs)
    expect(result.ok).toBe(false)
  })

  it('value が NaN の def は err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'damage', value: NaN })]

    expect(() => EffectFactory.build(defs)).not.toThrow()
    const result = EffectFactory.build(defs)
    expect(result.ok).toBe(false)
  })

  it('value が Infinity の def は err を返す', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'damage', value: Infinity })]

    expect(() => EffectFactory.build(defs)).not.toThrow()
    const result = EffectFactory.build(defs)
    expect(result.ok).toBe(false)
  })

  it('不正な def が混在しても throw しない。有効な def があっても err を返す', () => {
    const defs: EffectDef[] = [
      makeEffectDef({ type: 'damage', value: -1 }), // 不正
      makeEffectDef({ type: 'block', value: 5 }),    // 有効
    ]

    expect(() => EffectFactory.build(defs)).not.toThrow()
    const result = EffectFactory.build(defs)
    expect(result.ok).toBe(false)
  })
})

// ─────────────────────────────────────────────
// EffectFactory — EffectDef の value が正しく渡される
// ─────────────────────────────────────────────

describe('EffectFactory - EffectDef の value がエフェクトに反映される', () => {
  it('draw def の value=3 から DrawEffect(3) が生成される（間接確認）', () => {
    const defs: EffectDef[] = [makeEffectDef({ type: 'draw', value: 3 })]
    const result = EffectFactory.build(defs)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value[0]).toBeInstanceOf(DrawEffect)
  })
})
