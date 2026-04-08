import { z } from 'zod'
import {
  type EventDefinition,
  type EventChoice,
  type EventOutcome,
} from '../../domain/entities/EventDefinition'
import { type IEventRepository } from '../../domain/interfaces/IEventRepository'
import { type CardId, type EventId, type RelicId } from '../../shared/types'
import { EventSchema, type EventChoiceRaw, type EventOutcomeRaw } from '../data/schemas'
import eventsData from '../data/events.json'

/**
 * EventOutcomeRaw（snake_case）→ EventOutcome（camelCase）へのマッパー
 *
 * switch文により kind ごとのフィールドマッピングを型安全に記述する。
 * TypeScript の exhaustiveness check により、新しい kind 追加時にコンパイルエラーで検出できる。
 */
function toEventOutcome(raw: EventOutcomeRaw): EventOutcome {
  switch (raw.kind) {
    case 'gain_hp':
      return { kind: 'gain_hp', value: raw.value }
    case 'lose_hp':
      return { kind: 'lose_hp', value: raw.value }
    case 'gain_gold':
      return { kind: 'gain_gold', value: raw.value }
    case 'lose_gold':
      return { kind: 'lose_gold', value: raw.value }
    case 'add_card':
      return { kind: 'add_card', cardId: raw.card_id as CardId }
    case 'remove_card':
      return {
        kind: 'remove_card',
        ...(raw.card_id !== undefined ? { cardId: raw.card_id as CardId } : {}),
      }
    case 'gain_relic':
      return { kind: 'gain_relic', relicId: raw.relic_id as RelicId }
    case 'nothing':
      return { kind: 'nothing' }
  }
}

/**
 * EventChoiceRaw（snake_case）→ EventChoice（camelCase）へのマッパー
 */
function toEventChoice(raw: EventChoiceRaw): EventChoice {
  return {
    text: raw.text,
    outcomes: raw.outcomes.map(toEventOutcome),
  }
}

/**
 * JSONファイルベースのイベントリポジトリ
 *
 * JSONファイルを z.array(EventSchema).parse() で一括検証し、EventDefinitionとして返す。
 * 参照可能な層: domain/interfaces, domain/entities, shared/types,
 *               infrastructure/data
 */
export class JsonEventRepository implements IEventRepository {
  private readonly events: ReadonlyArray<EventDefinition>

  constructor() {
    const parsed = z.array(EventSchema).parse(eventsData)
    this.events = parsed.map((raw) => ({
      id: raw.id as EventId,
      name: raw.name,
      description: raw.description,
      choices: raw.choices.map(toEventChoice),
    }))
  }

  findById(eventId: EventId): EventDefinition | undefined {
    return this.events.find((e) => e.id === eventId)
  }

  findAll(): ReadonlyArray<EventDefinition> {
    return this.events
  }
}
