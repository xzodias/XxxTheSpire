import { describe, it, expect, beforeAll } from 'vitest'
import { JsonCardRepository } from '../../../src/infrastructure/repositories/JsonCardRepository'
import { CardType } from '../../../src/domain/enums/CardType'
import { Rarity } from '../../../src/domain/enums/Rarity'
import { TargetType } from '../../../src/domain/enums/TargetType'

describe('JsonCardRepository', () => {
  // 全テストで同一の read-only リポジトリを共有（毎回パースは不要）
  let repository: JsonCardRepository

  beforeAll(() => {
    repository = new JsonCardRepository()
  })

  describe('constructor', () => {
    it('有効な JSON ファイルでインスタンスを生成できる', () => {
      expect(() => new JsonCardRepository()).not.toThrow()
    })
  })

  describe('findAll', () => {
    it('ironclad.json の全3カードを返す', () => {
      const cards = repository.findAll()
      expect(cards).toHaveLength(3)
    })

    it('Cardエンティティの必須フィールドが全て存在する', () => {
      const cards = repository.findAll()
      for (const card of cards) {
        expect(card.id).toBeTruthy()
        expect(card.name).toBeTruthy()
        expect(card.description).toBeTruthy()
        expect(typeof card.cost).toBe('number')
        expect(Object.values(CardType)).toContain(card.type)
        expect(Object.values(Rarity)).toContain(card.rarity)
        expect(Object.values(TargetType)).toContain(card.targetType)
        expect(Array.isArray(card.effects)).toBe(true)
        expect(typeof card.upgraded).toBe('boolean')
      }
    })

    it.todo('target を持たない effect は target フィールドを含まない（target なし effect のデータ追加時に実装）')
  })

  describe('findById', () => {
    it('存在するIDでカードを返す', () => {
      const card = repository.findById('strike_r')
      expect(card).toBeDefined()
      expect(card?.id).toBe('strike_r')
    })

    it('strike_r のフィールドが正しくマッピングされている', () => {
      const card = repository.findById('strike_r')
      expect(card).toBeDefined()
      if (!card) return

      expect(card.name).toBe('Strike')
      expect(card.description).toBe('Deal 6 damage.')
      expect(card.cost).toBe(1)
      expect(card.type).toBe(CardType.Attack)
      expect(card.rarity).toBe(Rarity.Common)
      expect(card.targetType).toBe(TargetType.Single)
      expect(card.upgraded).toBe(false)
    })

    it('strike_r の effects が正しくマッピングされている', () => {
      const card = repository.findById('strike_r')
      expect(card?.effects).toHaveLength(1)
      expect(card?.effects[0]).toEqual({
        type: 'damage',
        value: 6,
        target: 'single_enemy',
      })
    })

    it('bash の複数エフェクトが正しくマッピングされている', () => {
      const card = repository.findById('bash')
      expect(card?.effects).toHaveLength(2)
      expect(card?.effects[0]).toEqual({ type: 'damage', value: 8, target: 'single_enemy' })
      expect(card?.effects[1]).toEqual({ type: 'vulnerable', value: 2, target: 'single_enemy' })
    })

    it('存在しないIDで undefined を返す', () => {
      const card = repository.findById('nonexistent')
      expect(card).toBeUndefined()
    })

    it('空文字IDで undefined を返す', () => {
      const card = repository.findById('')
      expect(card).toBeUndefined()
    })
  })

  describe('findByRarity', () => {
    it('Common カードを返す', () => {
      const cards = repository.findByRarity(Rarity.Common)
      expect(cards.length).toBeGreaterThan(0)
      for (const card of cards) {
        expect(card.rarity).toBe(Rarity.Common)
      }
    })

    it('存在しないレアリティでは空配列を返す', () => {
      // ironclad.json に Rare カードは存在しない
      const cards = repository.findByRarity(Rarity.Rare)
      expect(cards).toHaveLength(0)
    })

    it('findByRarity の結果は findAll の部分集合である', () => {
      const all = repository.findAll()
      const commons = repository.findByRarity(Rarity.Common)
      for (const card of commons) {
        expect(all.some((c) => c.id === card.id)).toBe(true)
      }
    })
  })
})
