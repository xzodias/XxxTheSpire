// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageSaveRepository } from '../../../src/infrastructure/repositories/LocalStorageSaveRepository'
import type { Player } from '../../../src/domain/entities/Player'

/**
 * Player インターフェースを満たす最小限のモックオブジェクト。
 * Health/Block/Energy/Gold はクラスインスタンスではなく
 * 構造的に互換な plain object として扱う。
 */
const mockPlayer: Player = {
  id: 'ironclad',
  name: 'Ironclad',
  health: { current: 80, max: 80 } as Player['health'],
  block: { value: 0 } as Player['block'],
  powers: [],
  statusEffects: [],
  energy: { current: 3, max: 3 } as Player['energy'],
  gold: { amount: 99 } as Player['gold'],
  deck: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  relics: [],
  maxPotionSlots: 3,
  potions: [null, null, null],
}

describe('LocalStorageSaveRepository', () => {
  let repository: LocalStorageSaveRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new LocalStorageSaveRepository()
  })

  describe('exists', () => {
    it('セーブデータが存在しない場合は false を返す', () => {
      expect(repository.exists()).toBe(false)
    })

    it('save 後は true を返す', () => {
      repository.save(mockPlayer)
      expect(repository.exists()).toBe(true)
    })
  })

  describe('save / load', () => {
    it('セーブデータが存在しない場合は null を返す', () => {
      expect(repository.load()).toBeNull()
    })

    it('save したデータを load で取得できる', () => {
      repository.save(mockPlayer)
      const loaded = repository.load()
      expect(loaded).not.toBeNull()
      expect(loaded?.id).toBe('ironclad')
      expect(loaded?.health).toEqual({ current: 80, max: 80 })
      expect(loaded?.gold).toEqual({ amount: 99 })
    })

    it('localStorage にバージョンフィールド付きで保存される', () => {
      repository.save(mockPlayer)
      const raw = localStorage.getItem('xxx-the-spire-save')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!) as { version: number; data: unknown }
      expect(parsed.version).toBe(1)
      expect(parsed.data).toBeDefined()
    })
  })

  describe('delete', () => {
    it('save 後に delete すると exists が false になる', () => {
      repository.save(mockPlayer)
      repository.delete()
      expect(repository.exists()).toBe(false)
    })

    it('delete 後は load が null を返す', () => {
      repository.save(mockPlayer)
      repository.delete()
      expect(repository.load()).toBeNull()
    })
  })

  describe('バージョン不一致', () => {
    it('保存データのバージョンが異なる場合は null を返す', () => {
      localStorage.setItem('xxx-the-spire-save', JSON.stringify({ version: 999, data: mockPlayer }))
      expect(repository.load()).toBeNull()
    })
  })
})
