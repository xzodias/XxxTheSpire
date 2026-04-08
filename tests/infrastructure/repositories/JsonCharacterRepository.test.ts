import { describe, it, expect, beforeAll } from 'vitest'
import { JsonCharacterRepository } from '../../../src/infrastructure/repositories/JsonCharacterRepository'
import { type CharacterId } from '../../../src/shared/types'

describe('JsonCharacterRepository', () => {
  let repository: JsonCharacterRepository

  beforeAll(() => {
    repository = new JsonCharacterRepository()
  })

  // -------------------------------------------------------------------------
  // No.26: Factoryパターン・正常生成
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('有効な JSON ファイルでインスタンスを生成できる', () => {
      expect(() => new JsonCharacterRepository()).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作 / No.24: リポジトリ・データスキーマ検証
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    it('ironclad と silent の 2 キャラクターを返す', () => {
      const characters = repository.findAll()
      expect(characters).toHaveLength(2)
    })

    it('CharacterDefinition の必須フィールドが全て存在し型が正しい', () => {
      const characters = repository.findAll()
      for (const character of characters) {
        expect(typeof character.id).toBe('string')
        expect(character.id.length).toBeGreaterThan(0)

        expect(typeof character.name).toBe('string')
        expect(character.name.length).toBeGreaterThan(0)

        expect(typeof character.startingHp).toBe('number')
        expect(character.startingHp).toBeGreaterThan(0)

        expect(typeof character.maxEnergy).toBe('number')
        expect(character.maxEnergy).toBeGreaterThan(0)

        expect(Array.isArray(character.startingDeck)).toBe(true)
        expect(character.startingDeck.length).toBeGreaterThan(0)

        for (const entry of character.startingDeck) {
          expect(typeof entry.id).toBe('string')
          expect(entry.id.length).toBeGreaterThan(0)
          expect(typeof entry.count).toBe('number')
          expect(entry.count).toBeGreaterThan(0)
        }

        expect(typeof character.startingRelicId).toBe('string')
        expect(character.startingRelicId.length).toBeGreaterThan(0)
      }
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('存在するIDでCharacterDefinitionを返す', () => {
      const character = repository.findById('ironclad' as CharacterId)
      expect(character).toBeDefined()
      expect(character?.id).toBe('ironclad')
    })

    // AC4: 取得したキャラクター定義に初期デッキ・初期HP・開始レリック・エネルギー上限が含まれること
    describe('ironclad のフィールドが正しくマッピングされている', () => {
      it('基本フィールド（name / startingHp / maxEnergy）が正しい', () => {
        const character = repository.findById('ironclad' as CharacterId)
        expect(character).toBeDefined()
        if (!character) return

        expect(character.name).toBe('Ironclad')
        expect(character.startingHp).toBe(80)
        expect(character.maxEnergy).toBe(3)
      })

      it('startingRelicId が正しい', () => {
        const character = repository.findById('ironclad' as CharacterId)
        expect(character?.startingRelicId).toBe('burning_blood')
      })

      it('startingDeck が正しくマッピングされている', () => {
        const character = repository.findById('ironclad' as CharacterId)
        expect(character).toBeDefined()
        if (!character) return

        expect(character.startingDeck).toHaveLength(3)
        expect(character.startingDeck).toContainEqual({ id: 'strike_r', count: 5 })
        expect(character.startingDeck).toContainEqual({ id: 'defend_r', count: 4 })
        expect(character.startingDeck).toContainEqual({ id: 'bash', count: 1 })
      })
    })

    describe('silent のフィールドが正しくマッピングされている', () => {
      it('基本フィールド（name / startingHp / maxEnergy）が正しい', () => {
        const character = repository.findById('silent' as CharacterId)
        expect(character).toBeDefined()
        if (!character) return

        expect(character.name).toBe('Silent')
        expect(character.startingHp).toBe(70)
        expect(character.maxEnergy).toBe(3)
      })

      it('startingRelicId が正しい', () => {
        const character = repository.findById('silent' as CharacterId)
        expect(character?.startingRelicId).toBe('ring_of_the_snake')
      })

      it('startingDeck が正しくマッピングされている', () => {
        const character = repository.findById('silent' as CharacterId)
        expect(character).toBeDefined()
        if (!character) return

        expect(character.startingDeck).toHaveLength(2)
        expect(character.startingDeck).toContainEqual({ id: 'strike_g', count: 6 })
        expect(character.startingDeck).toContainEqual({ id: 'defend_g', count: 6 })
      })
    })

    // -------------------------------------------------------------------------
    // No.08: 異常系・存在しないキー（AC2）
    // -------------------------------------------------------------------------
    it('存在しないIDで undefined を返す', () => {
      const character = repository.findById('nonexistent' as CharacterId)
      expect(character).toBeUndefined()
    })

    it('空文字IDで undefined を返す', () => {
      const character = repository.findById('' as CharacterId)
      expect(character).toBeUndefined()
    })

    it('大文字・小文字が異なるIDで undefined を返す（大文字小文字厳密一致）', () => {
      const character = repository.findById('Ironclad' as CharacterId)
      expect(character).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // AC3: 依存方向ルール検証（No.27: Factoryパターン・異常生成）
  // -------------------------------------------------------------------------
  describe('依存方向・スキーマ検証', () => {
    it('JsonCharacterRepository は ICharacterRepository を実装している', () => {
      // findById / findAll の両メソッドを持つことで interface 実装を確認する
      expect(typeof repository.findById).toBe('function')
      expect(typeof repository.findAll).toBe('function')
    })

    it('findAll の結果は findById の部分集合である', () => {
      const all = repository.findAll()
      for (const character of all) {
        const found = repository.findById(character.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(character.id)
      }
    })
  })
})
