import { describe, it, expect, beforeAll } from 'vitest'
import { JsonRelicRepository } from '../../../src/infrastructure/repositories/JsonRelicRepository'
import { type StateWithPlayer } from '../../../src/domain/entities/Relic'
import { Rarity } from '../../../src/domain/enums/Rarity'

describe('JsonRelicRepository', () => {
  // 全テストで同一の read-only リポジトリを共有（毎回パースは不要）
  let repository: JsonRelicRepository

  beforeAll(() => {
    repository = new JsonRelicRepository()
  })

  describe('constructor', () => {
    it('有効な JSON ファイルでインスタンスを生成できる', () => {
      expect(() => new JsonRelicRepository()).not.toThrow()
    })
  })

  describe('findAll', () => {
    it('ironclad.json の全6レリックを返す', () => {
      // ironclad.json 現在 6件: Common×3, Uncommon×2, Rare×1
      const relics = repository.findAll()
      expect(relics).toHaveLength(6)
    })

    it('Relicエンティティの必須フィールドが全て存在する', () => {
      const relics = repository.findAll()
      for (const relic of relics) {
        expect(relic.id).toBeTruthy()
        expect(relic.name).toBeTruthy()
        expect(relic.description).toBeTruthy()
        expect(Object.values(Rarity)).toContain(relic.rarity)
        expect(Array.isArray(relic.triggers)).toBe(true)
        expect(typeof relic.onTrigger).toBe('function')
      }
    })
  })

  describe('findById', () => {
    it('存在するIDでレリックを返す', () => {
      const relic = repository.findById('akabeko')
      expect(relic).toBeDefined()
      expect(relic?.id).toBe('akabeko')
    })

    it('akabeko のフィールドが正しくマッピングされている', () => {
      const relic = repository.findById('akabeko')
      expect(relic).toBeDefined()
      if (!relic) return

      expect(relic.name).toBe('Akabeko')
      expect(relic.description).toBe('Your first Attack each combat deals 8 additional damage.')
      expect(relic.rarity).toBe(Rarity.Common)
    })

    it('存在しないIDで undefined を返す', () => {
      const relic = repository.findById('nonexistent')
      expect(relic).toBeUndefined()
    })

    it('空文字IDで undefined を返す', () => {
      const relic = repository.findById('')
      expect(relic).toBeUndefined()
    })
  })

  describe('findByRarity', () => {
    it('Common レリックを返す', () => {
      const relics = repository.findByRarity(Rarity.Common)
      expect(relics.length).toBeGreaterThan(0)
      for (const relic of relics) {
        expect(relic.rarity).toBe(Rarity.Common)
      }
    })

    it('Uncommon レリックを返す', () => {
      const relics = repository.findByRarity(Rarity.Uncommon)
      expect(relics.length).toBeGreaterThan(0)
      for (const relic of relics) {
        expect(relic.rarity).toBe(Rarity.Uncommon)
      }
    })

    it('Rare レリックを返す', () => {
      const relics = repository.findByRarity(Rarity.Rare)
      expect(relics.length).toBeGreaterThan(0)
      for (const relic of relics) {
        expect(relic.rarity).toBe(Rarity.Rare)
      }
    })

    it('ironclad.json の Common は3件', () => {
      // ironclad.json 現在 Common×3 (akabeko, bag_of_preparation, vajra)
      const relics = repository.findByRarity(Rarity.Common)
      expect(relics).toHaveLength(3)
    })

    it('存在しないレアリティでは空配列を返す', () => {
      // ironclad.json に Rare は存在するが、TypeScriptの Rarity enum に存在しない値のテストは
      // 実行時に undefined になるため、代わりに未定義キャストで検証する
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relics = repository.findByRarity('NonExistent' as any)
      expect(relics).toHaveLength(0)
    })

    it('findByRarity の結果は findAll の部分集合である', () => {
      const all = repository.findAll()
      const commons = repository.findByRarity(Rarity.Common)
      for (const relic of commons) {
        expect(all.some((r) => r.id === relic.id)).toBe(true)
      }
    })
  })

  describe('onTrigger（デフォルト実装）', () => {
    it('onTrigger はイベントに関わらず状態をそのまま返す', () => {
      const relic = repository.findById('akabeko')
      expect(relic).toBeDefined()
      if (!relic) return

      const state: StateWithPlayer = { player: { relics: [] } }
      const result = relic.onTrigger({ type: 'on_combat_start' }, state)
      expect(result).toBe(state)
    })

    it('triggers は空配列である', () => {
      const relic = repository.findById('akabeko')
      expect(relic?.triggers).toEqual([])
    })
  })
})
