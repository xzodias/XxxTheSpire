import { type Result, ok, err } from '../../shared/types'
import { Health } from '../../domain/value-objects/Health'
import { Energy } from '../../domain/value-objects/Energy'
import { Gold } from '../../domain/value-objects/Gold'
import { Block } from '../../domain/value-objects/Block'
import { type Seed } from '../../domain/value-objects/Seed'
import { type Player } from '../../domain/entities/Player'
import { type MapNode } from '../../domain/entities/MapNode'
import { type Card } from '../../domain/entities/Card'
import { type ICardRepository } from '../../domain/interfaces/ICardRepository'
import { generateMap } from '../../domain/rules/MapGenerator'
import {
  STARTING_ENERGY,
  MAX_ENERGY,
  STARTING_GOLD,
  MAX_POTIONS,
  MAP_FLOORS_PER_ACT,
  MAP_WIDTH,
  IRONCLAD_STARTING_HP,
  IRONCLAD_STARTING_DECK,
} from '../../shared/constants'

export class StartRunUseCase {
  constructor(private readonly cardRepo: ICardRepository) {}

  execute(characterId: string, seed: Seed): Result<{ player: Player; map: MapNode[][] }, string> {
    // TODO: T111 CharacterRepository 実装後、ICharacterRepository.findById(characterId) に置き換える。
    // 現在は Ironclad のみ対応（暫定実装）。
    if (characterId !== 'ironclad') {
      return err('unknown character')
    }

    // Build initial deck
    const deck: Card[] = []
    for (const { id, count } of IRONCLAD_STARTING_DECK) {
      const card = this.cardRepo.findById(id)
      if (card === undefined) {
        return err(`Card not found: ${id}`)
      }
      for (let i = 0; i < count; i++) {
        deck.push(card)
      }
    }

    // Create value objects
    const healthResult = Health.create(IRONCLAD_STARTING_HP, IRONCLAD_STARTING_HP)
    if (!healthResult.ok) return err(healthResult.error)

    const energyResult = Energy.create(STARTING_ENERGY, MAX_ENERGY)
    if (!energyResult.ok) return err(energyResult.error)

    const goldResult = Gold.create(STARTING_GOLD)
    if (!goldResult.ok) return err(goldResult.error)

    const blockResult = Block.create(0)
    if (!blockResult.ok) return err(blockResult.error)

    // Build player
    const player: Player = {
      id: 'ironclad',
      name: 'Ironclad',
      health: healthResult.value,
      energy: energyResult.value,
      gold: goldResult.value,
      block: blockResult.value,
      deck,
      hand: [],
      discardPile: [],
      exhaustPile: [],
      relics: [],
      powers: [],
      statusEffects: [],
      potions: Array.from<null>({ length: MAX_POTIONS }).fill(null),
      maxPotionSlots: MAX_POTIONS,
    }

    // Generate map
    const map = generateMap(seed, MAP_FLOORS_PER_ACT, MAP_WIDTH)

    return ok({ player, map })
  }
}
