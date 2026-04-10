import { describe, it, expect } from 'vitest'
import { updateEnemy } from '../../../src/domain/rules/EnemyRules'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type EnemyId } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeEnemy(id: string, hp = 50, blockValue = 0): Enemy {
  const health = Health.create(hp, hp)
  const block = Block.create(blockValue)
  if (!health.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id,
    name: `Enemy_${id}`,
    enemyId: id as EnemyId,
    intent: { type: 'unknown' },
    health: health.value,
    block: block.value,
    powers: [],
    statusEffects: [],
  }
}

// ─────────────────────────────────────────────
// updateEnemy — 正常系
// ─────────────────────────────────────────────

describe('updateEnemy - 正常系', () => {
  it('指定 id の敵のみが updater によって更新される', () => {
    const enemy = makeEnemy('jaw_worm', 50)
    const enemies = [enemy]

    const result = updateEnemy(enemies, 'jaw_worm', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value[0]?.health.current).toBe(40)
  })

  it('複数の敵がいる場合、対象の敵のみが更新される', () => {
    const target = makeEnemy('jaw_worm', 50)
    const other = makeEnemy('louse', 30)
    const enemies = [target, other]

    const result = updateEnemy(enemies, 'jaw_worm', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value[0]?.health.current).toBe(40) // jaw_worm 更新済み
      expect(result.value[1]?.health.current).toBe(30) // louse 変化なし
    }
  })

  it('空の enemies 配列を渡すと enemy_not_found を返す', () => {
    const result = updateEnemy([], 'jaw_worm', (e) => e)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('enemy_not_found')
  })
})

// ─────────────────────────────────────────────
// updateEnemy — 対象なし
// ─────────────────────────────────────────────

describe('updateEnemy - 対象なし（Result error）', () => {
  it('対象 id が存在しない場合は enemy_not_found を返す', () => {
    const enemy = makeEnemy('jaw_worm', 50)
    const enemies = [enemy]

    const result = updateEnemy(enemies, 'non_existent', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('enemy_not_found')
  })

  it('対象なし時、元の敵には影響がない', () => {
    const enemy = makeEnemy('jaw_worm', 50)
    const originalHp = enemy.health.current

    updateEnemy([enemy], 'non_existent', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(enemy.health.current).toBe(originalHp)
  })
})

// ─────────────────────────────────────────────
// updateEnemy — イミュータビリティ
// ─────────────────────────────────────────────

describe('updateEnemy - イミュータビリティ', () => {
  it('元の enemies 配列を変更しない', () => {
    const enemy = makeEnemy('jaw_worm', 50)
    const enemies = [enemy]
    const originalHp = enemy.health.current

    updateEnemy(enemies, 'jaw_worm', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(enemy.health.current).toBe(originalHp)
    expect(enemies[0]?.health.current).toBe(originalHp)
  })

  it('新しい配列を返す（元の参照とは異なる）', () => {
    const enemies = [makeEnemy('jaw_worm', 50)]

    const result = updateEnemy(enemies, 'jaw_worm', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).not.toBe(enemies)
  })

  it('対象でない敵オブジェクトの参照は変わらない', () => {
    const target = makeEnemy('jaw_worm', 50)
    const other = makeEnemy('louse', 30)
    const enemies = [target, other]

    const result = updateEnemy(enemies, 'jaw_worm', (e) => ({
      ...e,
      health: e.health.takeDamage(10),
    }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value[1]).toBe(other) // louse は同一参照
  })
})
