import type { CardId, EnemyId } from '../../shared/types'

// --- Event payload types ---

export type PlayCardPayload = {
  readonly cardId: CardId
  readonly targetIndex?: number
}

export type AnimationCompletePayload = {
  readonly animationKey: string
}

export type CombatStartPayload = {
  readonly enemyId: EnemyId
}

export type CombatEndPayload = {
  readonly playerWon: boolean
}

// --- Event map ---

export type EventMap = {
  playCard: PlayCardPayload
  animationComplete: AnimationCompletePayload
  combatStart: CombatStartPayload
  combatEnd: CombatEndPayload
}

// --- EventBus ---

type Handler<T> = (payload: T) => void
type Unsubscribe = () => void

export class EventBusImpl {
  // TypeScript cannot infer a unified Map value type for discriminated generics.
  // The public API (on/off/emit) is fully type-safe via K extends keyof EventMap.
  // The `any` is intentional and confined to this private implementation detail.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<keyof EventMap, Set<Handler<any>>>()

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.handlers.get(event)
    if (set === undefined) return
    // Snapshot before iteration so that handlers calling off() during emit are safe.
    for (const handler of [...set]) {
      handler(payload)
    }
  }

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): Unsubscribe {
    let set = this.handlers.get(event)
    if (set === undefined) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    const set = this.handlers.get(event)
    if (set === undefined) return
    set.delete(handler)
    if (set.size === 0) {
      this.handlers.delete(event)
    }
  }
}

export const EventBus = new EventBusImpl()
