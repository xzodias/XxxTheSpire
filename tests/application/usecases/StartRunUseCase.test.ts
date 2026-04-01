import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StartRunUseCase } from '../../../src/application/usecases/StartRunUseCase'
import { type ICardRepository } from '../../../src/domain/interfaces/ICardRepository'
import { type Card } from '../../../src/domain/entities/Card'
import { Seed } from '../../../src/domain/value-objects/Seed'
import { CardType } from '../../../src/domain/enums/CardType'
import { Rarity } from '../../../src/domain/enums/Rarity'
import { TargetType } from '../../../src/domain/enums/TargetType'
import { type CardId } from '../../../src/shared/types'
import { MAP_FLOORS_PER_ACT } from '../../../src/shared/constants'

// --- Test helpers ---

function createMockCard(id: string): Card {
  return {
    id: id as CardId,
    name: id,
    description: `${id} description`,
    cost: 1,
    type: CardType.Attack,
    rarity: Rarity.Common,
    targetType: TargetType.Single,
    effects: [],
    upgraded: false,
  }
}

// --- Mocks ---

function buildCardRepo(overrides?: Partial<Record<string, Card | undefined>>): ICardRepository {
  const defaultCards: Record<string, Card> = {
    strike_r: createMockCard('strike_r'),
    defend_r: createMockCard('defend_r'),
    bash: createMockCard('bash'),
  }
  const cards = { ...defaultCards, ...overrides }
  return {
    findById: vi.fn((id: string) => cards[id]),
    findAll: vi.fn(() => []),
    findByRarity: vi.fn(() => []),
  }
}

function createSeed(): Seed {
  const result = Seed.create('test-seed-42')
  if (!result.ok) throw new Error('Failed to create seed')
  return result.value
}

// --- Tests ---

describe('StartRunUseCase', () => {
  let cardRepo: ICardRepository
  let seed: Seed
  let usecase: StartRunUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    cardRepo = buildCardRepo()
    seed = createSeed()
    usecase = new StartRunUseCase(cardRepo)
  })

  describe('正常系 (ironclad)', () => {
    it('1. ok: true を返す', () => {
      const result = usecase.execute('ironclad', seed)
      expect(result.ok).toBe(true)
    })

    it('2. player.id === "ironclad"', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.id).toBe('ironclad')
    })

    it('3. player.name === "Ironclad"', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.name).toBe('Ironclad')
    })

    it('4. player.health.current === 80 かつ player.health.max === 80', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.health.current).toBe(80)
      expect(result.value.player.health.max).toBe(80)
    })

    it('5. player.energy.current === 3 かつ player.energy.max === 3', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.energy.current).toBe(3)
      expect(result.value.player.energy.max).toBe(3)
    })

    it('6. player.gold.amount === 99', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.gold.amount).toBe(99)
    })

    it('7. player.block.value === 0', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.block.value).toBe(0)
    })

    it('8. player.deck.length === 10 (strike_r x5, defend_r x4, bash x1)', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.deck.length).toBe(10)
    })

    it('9. デッキに strike_r が5枚含まれる', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      const strikeCount = result.value.player.deck.filter((c) => c.id === 'strike_r').length
      expect(strikeCount).toBe(5)
    })

    it('10. デッキに defend_r が4枚含まれる', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      const defendCount = result.value.player.deck.filter((c) => c.id === 'defend_r').length
      expect(defendCount).toBe(4)
    })

    it('11. デッキに bash が1枚含まれる', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      const bashCount = result.value.player.deck.filter((c) => c.id === 'bash').length
      expect(bashCount).toBe(1)
    })

    it('12. player.hand が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.hand).toEqual([])
    })

    it('13. player.discardPile が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.discardPile).toEqual([])
    })

    it('14. player.exhaustPile が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.exhaustPile).toEqual([])
    })

    it('15. player.relics が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.relics).toEqual([])
    })

    it('16. player.powers が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.powers).toEqual([])
    })

    it('17. player.statusEffects が空配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.statusEffects).toEqual([])
    })

    it('18. player.potions が [null, null, null]', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.potions).toEqual([null, null, null])
    })

    it('19. player.maxPotionSlots === 3', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.player.maxPotionSlots).toBe(3)
    })

    it('20. map が MapNode[][] 型の配列', () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(Array.isArray(result.value.map)).toBe(true)
      expect(Array.isArray(result.value.map[0])).toBe(true)
    })

    it(`21. map.length === ${MAP_FLOORS_PER_ACT} (MAP_FLOORS_PER_ACT)`, () => {
      const result = usecase.execute('ironclad', seed)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.map.length).toBe(MAP_FLOORS_PER_ACT)
    })
  })

  describe('異常系', () => {
    it('22. 未知のcharacterId ("silent") で err("unknown character") を返す', () => {
      const result = usecase.execute('silent', seed)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('unknown character')
    })

    it('22b. 空文字列 characterId で err("unknown character") を返す', () => {
      const result = usecase.execute('', seed)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('unknown character')
    })

    it('23. findById("strike_r") が undefined の場合、err を返す', () => {
      const repoWithMissingStrike = buildCardRepo({ strike_r: undefined })
      const uc = new StartRunUseCase(repoWithMissingStrike)
      const result = uc.execute('ironclad', seed)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('Card not found: strike_r')
    })

    it('24. findById("defend_r") が undefined の場合、err を返す', () => {
      const repoWithMissingDefend = buildCardRepo({ defend_r: undefined })
      const uc = new StartRunUseCase(repoWithMissingDefend)
      const result = uc.execute('ironclad', seed)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('Card not found: defend_r')
    })

    it('25. findById("bash") が undefined の場合、err を返す', () => {
      const repoWithMissingBash = buildCardRepo({ bash: undefined })
      const uc = new StartRunUseCase(repoWithMissingBash)
      const result = uc.execute('ironclad', seed)
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('Card not found: bash')
    })
  })
})
