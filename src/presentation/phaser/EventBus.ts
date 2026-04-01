import type { CardId, EnemyId } from '../../shared/types'

// --- Event payload types ---

// React → Phaser: card animation instruction queued in Phaser
export type PlayCardAnimationPayload = {
  readonly cardId: CardId
  readonly targetId: EnemyId | string
  readonly animationType: string
}

// React → Phaser: combat effect request (damage flash, block, etc.)
export type CombatEffectRequestPayload = {
  readonly effectType: string
  readonly targetId: EnemyId | string
}

// Phaser internal: card animation completed (for queue management)
export type CardAnimationCompletePayload = {
  readonly cardId: CardId
}

// React ↔ Phaser: combat scene lifecycle
export type CombatStartPayload = {
  readonly enemyId: EnemyId
}

export type CombatEndPayload = {
  readonly playerWon: boolean
}

// --- Event map ---
//
// Design: 策A（カード操作=React、アニメーション=Phaser）
//   React → Phaser : playCardAnimation, combatEffectRequest
//   Phaser internal: cardAnimationComplete（queue management; not used for VM input control）
//   React ↔ Phaser : combatStart, combatEnd（scene lifecycle）

export type EventMap = {
  // React → Phaser: play card animation with type info
  playCardAnimation: PlayCardAnimationPayload
  // React → Phaser: request a combat effect (damage, block, etc.)
  combatEffectRequest: CombatEffectRequestPayload
  // Phaser internal: notifies that a card animation finished
  cardAnimationComplete: CardAnimationCompletePayload
  // Scene lifecycle
  combatStart: CombatStartPayload
  combatEnd: CombatEndPayload
}

// --- EventBus ---

export type Handler<T> = (payload: T) => void
export type Unsubscribe = () => void

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

  once<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): Unsubscribe {
    const wrapper = (payload: EventMap[K]) => {
      handler(payload)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
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
