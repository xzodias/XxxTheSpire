import { describe, it, expect, beforeAll, assert } from 'vitest'
import { JsonEventRepository } from '../../../src/infrastructure/repositories/JsonEventRepository'
import { type EventId } from '../../../src/shared/types'

describe('JsonEventRepository', () => {
  let repository: JsonEventRepository

  beforeAll(() => {
    repository = new JsonEventRepository()
  })

  // -------------------------------------------------------------------------
  // No.26: Factoryパターン・正常生成
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('有効な JSON ファイルでインスタンスを生成できる', () => {
      expect(() => new JsonEventRepository()).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作 / No.24: データスキーマ検証
  // -------------------------------------------------------------------------
  describe('findAll', () => {
    // AC1: イベントリポジトリからイベントデータを取得できること
    it('3件のイベントを返す', () => {
      const events = repository.findAll()
      expect(events).toHaveLength(3)
    })

    // AC2: イベントデータに選択肢と結果が含まれること
    it('EventDefinition の必須フィールドが全て存在し型が正しい', () => {
      const events = repository.findAll()
      for (const event of events) {
        expect(typeof event.id).toBe('string')
        expect(event.id.length).toBeGreaterThan(0)

        expect(typeof event.name).toBe('string')
        expect(event.name.length).toBeGreaterThan(0)

        expect(typeof event.description).toBe('string')
        expect(event.description.length).toBeGreaterThan(0)

        expect(Array.isArray(event.choices)).toBe(true)
        expect(event.choices.length).toBeGreaterThan(0)
      }
    })

    it('各 EventChoice に text と outcomes が含まれる', () => {
      const events = repository.findAll()
      for (const event of events) {
        for (const choice of event.choices) {
          expect(typeof choice.text).toBe('string')
          expect(choice.text.length).toBeGreaterThan(0)
          expect(Array.isArray(choice.outcomes)).toBe(true)
          expect(choice.outcomes.length).toBeGreaterThan(0)
        }
      }
    })

    it('各 EventOutcome の kind が文字列である', () => {
      const events = repository.findAll()
      for (const event of events) {
        for (const choice of event.choices) {
          for (const outcome of choice.outcomes) {
            expect(typeof outcome.kind).toBe('string')
          }
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // No.01: 正常系・基本動作
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('存在するIDで EventDefinition を返す', () => {
      const event = repository.findById('the_cleric' as EventId)
      expect(event).toBeDefined()
      expect(event?.id).toBe('the_cleric')
    })

    // AC2: 特定イベントの具体値検証
    describe('the_cleric のフィールドが正しくマッピングされている', () => {
      it('基本フィールド（name / description）が正しい', () => {
        const event = repository.findById('the_cleric' as EventId)
        assert(event !== undefined)

        expect(event.name).toBe('The Cleric')
        expect(typeof event.description).toBe('string')
        expect(event.description.length).toBeGreaterThan(0)
      })

      it('choices が2件である', () => {
        const event = repository.findById('the_cleric' as EventId)
        assert(event !== undefined)

        expect(event.choices).toHaveLength(2)
      })

      it('Heal 選択肢の outcome に gain_hp が含まれる', () => {
        const event = repository.findById('the_cleric' as EventId)
        assert(event !== undefined)

        const healChoice = event.choices.find((c) => c.text === 'Heal')
        assert(healChoice !== undefined)

        const gainHpOutcome = healChoice.outcomes.find((o) => o.kind === 'gain_hp')
        assert(gainHpOutcome !== undefined && gainHpOutcome.kind === 'gain_hp')
        expect(typeof gainHpOutcome.value).toBe('number')
        expect(gainHpOutcome.value).toBeGreaterThan(0)
      })

      it('Heal 選択肢の outcome に lose_gold が含まれる', () => {
        const event = repository.findById('the_cleric' as EventId)
        assert(event !== undefined)

        const healChoice = event.choices.find((c) => c.text === 'Heal')
        assert(healChoice !== undefined)

        const loseGoldOutcome = healChoice.outcomes.find((o) => o.kind === 'lose_gold')
        assert(loseGoldOutcome !== undefined && loseGoldOutcome.kind === 'lose_gold')
        expect(loseGoldOutcome.value).toBeGreaterThan(0)
      })

      it('Leave 選択肢の outcome に nothing が含まれる', () => {
        const event = repository.findById('the_cleric' as EventId)
        assert(event !== undefined)

        const leaveChoice = event.choices.find((c) => c.text === 'Leave')
        assert(leaveChoice !== undefined)

        const nothingOutcome = leaveChoice.outcomes.find((o) => o.kind === 'nothing')
        expect(nothingOutcome).toBeDefined()
      })
    })

    describe('dead_adventurer のフィールドが正しくマッピングされている', () => {
      it('Search Body 選択肢に gain_gold と add_card が含まれる', () => {
        const event = repository.findById('dead_adventurer' as EventId)
        assert(event !== undefined)

        const searchChoice = event.choices.find((c) => c.text === 'Search Body')
        assert(searchChoice !== undefined)

        expect(searchChoice.outcomes.some((o) => o.kind === 'gain_gold')).toBe(true)
        expect(searchChoice.outcomes.some((o) => o.kind === 'add_card')).toBe(true)
      })

      it('add_card の outcome に cardId が含まれる', () => {
        const event = repository.findById('dead_adventurer' as EventId)
        assert(event !== undefined)

        const searchChoice = event.choices.find((c) => c.text === 'Search Body')
        assert(searchChoice !== undefined)

        const addCardOutcome = searchChoice.outcomes.find((o) => o.kind === 'add_card')
        assert(addCardOutcome !== undefined && addCardOutcome.kind === 'add_card')
        expect(typeof addCardOutcome.cardId).toBe('string')
        expect(addCardOutcome.cardId.length).toBeGreaterThan(0)
      })
    })

    describe('golden_wing のフィールドが正しくマッピングされている', () => {
      it('Take Relic 選択肢に gain_relic が含まれる', () => {
        const event = repository.findById('golden_wing' as EventId)
        assert(event !== undefined)

        const takeRelicChoice = event.choices.find((c) => c.text === 'Take Relic')
        assert(takeRelicChoice !== undefined)

        const gainRelicOutcome = takeRelicChoice.outcomes.find((o) => o.kind === 'gain_relic')
        assert(gainRelicOutcome !== undefined && gainRelicOutcome.kind === 'gain_relic')
        expect(typeof gainRelicOutcome.relicId).toBe('string')
        expect(gainRelicOutcome.relicId.length).toBeGreaterThan(0)
      })

      it('Take Relic 選択肢に lose_hp が含まれる', () => {
        const event = repository.findById('golden_wing' as EventId)
        assert(event !== undefined)

        const takeRelicChoice = event.choices.find((c) => c.text === 'Take Relic')
        assert(takeRelicChoice !== undefined)

        const loseHpOutcome = takeRelicChoice.outcomes.find((o) => o.kind === 'lose_hp')
        assert(loseHpOutcome !== undefined && loseHpOutcome.kind === 'lose_hp')
        expect(loseHpOutcome.value).toBeGreaterThan(0)
      })
    })

    // -------------------------------------------------------------------------
    // No.08: 異常系・存在しないキー参照
    // -------------------------------------------------------------------------
    it('存在しないIDで undefined を返す', () => {
      const event = repository.findById('nonexistent' as EventId)
      expect(event).toBeUndefined()
    })

    it('空文字IDで undefined を返す', () => {
      const event = repository.findById('' as EventId)
      expect(event).toBeUndefined()
    })

    it('大文字・小文字が異なるIDで undefined を返す（大文字小文字厳密一致）', () => {
      const event = repository.findById('The_Cleric' as EventId)
      expect(event).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // No.22: リポジトリパターン保存と再取得の一貫性
  // IEventRepository interface実装確認
  // -------------------------------------------------------------------------
  describe('IEventRepository 実装確認・一貫性', () => {
    it('JsonEventRepository は IEventRepository を実装している', () => {
      expect(typeof repository.findById).toBe('function')
      expect(typeof repository.findAll).toBe('function')
    })

    it('findAll の結果は findById の部分集合である', () => {
      const all = repository.findAll()
      for (const event of all) {
        const found = repository.findById(event.id)
        expect(found).toBeDefined()
        expect(found?.id).toBe(event.id)
      }
    })
  })

  // -------------------------------------------------------------------------
  // No.27: Factoryパターン・異常生成（AC3: クラッシュしない）
  // -------------------------------------------------------------------------
  describe('不正データのハンドリング（EventSchema）', () => {
    it('必須フィールドが欠けた不正オブジェクトを渡すと ZodError をthrowする', async () => {
      const { EventSchema } = await import('../../../src/infrastructure/data/schemas')
      expect(() => EventSchema.parse({ id: 'bad' })).toThrow()
    })

    it('EventSchema.safeParse は不正データでcrashせず success: false を返す', async () => {
      const { EventSchema } = await import('../../../src/infrastructure/data/schemas')
      const result = EventSchema.safeParse({ id: 'bad', choices: 'not_an_array' })
      expect(result.success).toBe(false)
    })

    it('choices が空配列のデータは ZodError をthrowする', async () => {
      const { EventSchema } = await import('../../../src/infrastructure/data/schemas')
      expect(() =>
        EventSchema.parse({
          id: 'empty_choices',
          name: 'Empty',
          description: 'No choices',
          choices: [],
        }),
      ).toThrow()
    })

    it('outcomes が空配列の選択肢は ZodError をthrowする', async () => {
      const { EventSchema } = await import('../../../src/infrastructure/data/schemas')
      expect(() =>
        EventSchema.parse({
          id: 'empty_outcomes',
          name: 'Empty',
          description: 'No outcomes',
          choices: [{ text: 'Choice', outcomes: [] }],
        }),
      ).toThrow()
    })
  })
})
