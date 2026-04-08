import { describe, it, expect, beforeAll, assert } from 'vitest'
import { JsonEnemyRepository } from '../../../src/infrastructure/repositories/JsonEnemyRepository'
import { EnemySchema } from '../../../src/infrastructure/data/schemas'
import { type EnemyId } from '../../../src/shared/types'

describe('JsonEnemyRepository', () => {
  let repository: JsonEnemyRepository

  beforeAll(() => {
    repository = new JsonEnemyRepository()
  })

  // -------------------------------------------------------------------------
  // No.26: Factoryパターン・正常生成
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('有効な JSON ファイルでインスタンスを生成できる', () => {
      expect(() => new JsonEnemyRepository()).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作 / AC1: 敵リポジトリから敵データを取得できること
  // No.24: データスキーマ検証
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    // AC1: 敵リポジトリから敵データを取得できること
    it('少なくとも2件の敵を返す', () => {
      const enemies = repository.findAll()
      expect(enemies.length).toBeGreaterThanOrEqual(2)
    })

    // AC2: 敵が正しいHP・攻撃意図で初期化されること
    it('EnemyDefinition の必須フィールドが全て存在し型が正しい', () => {
      const enemies = repository.findAll()
      for (const enemy of enemies) {
        expect(typeof enemy.id).toBe('string')
        expect(enemy.id.length).toBeGreaterThan(0)

        expect(typeof enemy.name).toBe('string')
        expect(enemy.name.length).toBeGreaterThan(0)

        expect(typeof enemy.hp).toBe('object')
        expect(typeof enemy.hp.min).toBe('number')
        expect(typeof enemy.hp.max).toBe('number')

        expect(Array.isArray(enemy.intents)).toBe(true)
        expect(enemy.intents.length).toBeGreaterThan(0)
      }
    })

    // AC2: 各 Intent に type が含まれること
    it('各 Intent に type が含まれる', () => {
      const enemies = repository.findAll()
      for (const enemy of enemies) {
        for (const intent of enemy.intents) {
          expect(typeof intent.type).toBe('string')
          expect(intent.type.length).toBeGreaterThan(0)
        }
      }
    })

    // AC4: hp.min <= hp.max の制約
    it('hp.min は hp.max 以下である', () => {
      const enemies = repository.findAll()
      for (const enemy of enemies) {
        expect(enemy.hp.min).toBeLessThanOrEqual(enemy.hp.max)
      }
    })

    // AC4: hp.min, hp.max が正の整数であること
    it('hp.min と hp.max は正の整数である', () => {
      const enemies = repository.findAll()
      for (const enemy of enemies) {
        expect(enemy.hp.min).toBeGreaterThan(0)
        expect(enemy.hp.max).toBeGreaterThan(0)
        expect(Number.isInteger(enemy.hp.min)).toBe(true)
        expect(Number.isInteger(enemy.hp.max)).toBe(true)
      }
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作 / AC1
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('存在するIDで EnemyDefinition を返す', () => {
      const all = repository.findAll()
      assert(all.length > 0)
      const first = all[0]
      assert(first !== undefined)
      const firstId = first.id
      const enemy = repository.findById(firstId)
      expect(enemy).toBeDefined()
      expect(enemy?.id).toBe(firstId)
    })

    // AC2: slime の具体値検証
    describe('slime のフィールドが正しくマッピングされている', () => {
      it('slime の基本フィールド（name / hp）が正しい', () => {
        const enemy = repository.findById('slime' as EnemyId)
        assert(enemy !== undefined)

        expect(enemy.name).toBe('Slime')
        expect(enemy.hp.min).toBeGreaterThan(0)
        expect(enemy.hp.max).toBeGreaterThanOrEqual(enemy.hp.min)
      })

      // AC2: intents に attack が含まれること
      it('slime の intents に attack intent が含まれる', () => {
        const enemy = repository.findById('slime' as EnemyId)
        assert(enemy !== undefined)

        const attackIntent = enemy.intents.find((i) => i.type === 'attack')
        expect(attackIntent).toBeDefined()
        assert(attackIntent !== undefined)
        expect(typeof attackIntent.value).toBe('number')
        expect(attackIntent.value).toBeGreaterThan(0)
      })
    })

    // AC2: guard の具体値検証
    describe('guard のフィールドが正しくマッピングされている', () => {
      it('guard の基本フィールド（name / hp）が正しい', () => {
        const enemy = repository.findById('guard' as EnemyId)
        assert(enemy !== undefined)

        expect(enemy.name).toBe('Guard')
        expect(enemy.hp.min).toBeGreaterThan(0)
        expect(enemy.hp.max).toBeGreaterThanOrEqual(enemy.hp.min)
      })

      it('guard の intents に block intent が含まれる', () => {
        const enemy = repository.findById('guard' as EnemyId)
        assert(enemy !== undefined)

        const blockIntent = enemy.intents.find((i) => i.type === 'block')
        expect(blockIntent).toBeDefined()
      })
    })

    // -------------------------------------------------------------------------
    // No.08: 異常系・存在しないキー参照
    // -------------------------------------------------------------------------
    it('存在しないIDで undefined を返す', () => {
      const enemy = repository.findById('nonexistent' as EnemyId)
      expect(enemy).toBeUndefined()
    })

    it('空文字IDで undefined を返す', () => {
      const enemy = repository.findById('' as EnemyId)
      expect(enemy).toBeUndefined()
    })

    it('大文字・小文字が異なるIDで undefined を返す（大文字小文字厳密一致）', () => {
      const enemy = repository.findById('Slime' as EnemyId)
      expect(enemy).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // No.22: リポジトリパターン保存と再取得の一貫性
  // No.23: IDによる単件取得
  // IEnemyRepository interface実装確認
  // -------------------------------------------------------------------------
  describe('IEnemyRepository 実装確認・一貫性', () => {
    it('JsonEnemyRepository は IEnemyRepository を実装している', () => {
      expect(typeof repository.findById).toBe('function')
      expect(typeof repository.findAll).toBe('function')
    })

    it('findAll の結果は findById の部分集合である', () => {
      const all = repository.findAll()
      for (const enemy of all) {
        const found = repository.findById(enemy.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(enemy.id)
      }
    })

    it('findAll は毎回同じ件数を返す（immutable）', () => {
      const first = repository.findAll()
      const second = repository.findAll()
      expect(first.length).toBe(second.length)
    })
  })

  // -------------------------------------------------------------------------
  // No.27: Factoryパターン・異常生成（AC3: 不正データでクラッシュしない）
  // -------------------------------------------------------------------------
  describe('不正データのハンドリング（EnemySchema）', () => {
    it('必須フィールドが欠けた不正オブジェクトを渡すと ZodError をthrowする', () => {
      expect(() => EnemySchema.parse({ id: 'bad' })).toThrow()
    })

    it('EnemySchema.safeParse は不正データでcrashせず success: false を返す', () => {
      const result = EnemySchema.safeParse({ id: 'bad', intents: 'not_an_array' })
      expect(result.success).toBe(false)
    })

    it('hp_min が負の数のデータは ZodError をthrowする', () => {
      expect(() =>
        EnemySchema.parse({
          id: 'invalid_enemy',
          name: 'Invalid',
          hp_min: -1,
          hp_max: 10,
          intents: [{ type: 'attack', value: 5 }],
        }),
      ).toThrow()
    })

    it('hp_min が hp_max より大きいデータは ZodError をthrowする', () => {
      expect(() =>
        EnemySchema.parse({
          id: 'bad_hp_range',
          name: 'Bad HP Range',
          hp_min: 20,
          hp_max: 10,
          intents: [{ type: 'attack', value: 5 }],
        }),
      ).toThrow()
    })

    it('intents が空配列のデータは ZodError をthrowする', () => {
      expect(() =>
        EnemySchema.parse({
          id: 'no_intents',
          name: 'No Intents',
          hp_min: 10,
          hp_max: 20,
          intents: [],
        }),
      ).toThrow()
    })

    it('intent の type が不正な値のデータは ZodError をthrowする', () => {
      expect(() =>
        EnemySchema.parse({
          id: 'bad_intent',
          name: 'Bad Intent',
          hp_min: 10,
          hp_max: 20,
          intents: [{ type: 'invalid_type' }],
        }),
      ).toThrow()
    })
  })
})
