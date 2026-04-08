import {
  type CharacterDefinition,
  type StarterDeckEntry,
} from '../../domain/entities/CharacterDefinition'
import { type ICharacterRepository } from '../../domain/interfaces/ICharacterRepository'
import { type CardId, type CharacterId, type RelicId } from '../../shared/types'
import { CharacterSchema, type CharacterRaw, type StarterDeckEntryRaw } from '../data/schemas'
import ironcladData from '../data/characters/ironclad.json'
import silentData from '../data/characters/silent.json'

/**
 * スターターデッキエントリの変換
 *
 * StarterDeckEntryRaw（snake_case）→ StarterDeckEntry（camelCase）へのマッピング。
 */
function toStarterDeckEntry(raw: StarterDeckEntryRaw): StarterDeckEntry {
  return {
    id: raw.id as CardId,
    count: raw.count,
  }
}

/**
 * CharacterRaw（snake_case）→ CharacterDefinition（camelCase）へのマッパー
 */
function toCharacterDefinition(raw: CharacterRaw): CharacterDefinition {
  return {
    id: raw.id as CharacterId,
    name: raw.name,
    startingHp: raw.starting_hp,
    maxEnergy: raw.max_energy,
    startingDeck: raw.starting_deck.map(toStarterDeckEntry),
    startingRelicId: raw.starting_relic_id as RelicId,
  }
}

/**
 * JSONファイルベースのキャラクターリポジトリ
 *
 * JSONファイルをZodスキーマで検証し、CharacterDefinitionとして返す。
 * 参照可能な層: domain/interfaces, domain/entities, shared/types,
 *               infrastructure/data
 */
export class JsonCharacterRepository implements ICharacterRepository {
  private readonly characters: readonly CharacterDefinition[]

  constructor() {
    const rawData: unknown[] = [ironcladData, silentData]
    this.characters = rawData.map((raw) => {
      const parsed = CharacterSchema.parse(raw)
      return toCharacterDefinition(parsed)
    })
  }

  findById(characterId: CharacterId): CharacterDefinition | undefined {
    return this.characters.find((c) => c.id === characterId)
  }

  findAll(): readonly CharacterDefinition[] {
    return this.characters
  }
}
