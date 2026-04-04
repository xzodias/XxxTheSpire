import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  EventBusImpl,
  type CombatStartPayload,
  type CombatEndPayload,
  type PlayCardAnimationPayload,
} from '../../../src/presentation/phaser/EventBus'
import type { EnemyId, CardId } from '../../../src/shared/types'

// Shared test fixtures
const TEST_ENEMY_ID = 'slime' as EnemyId
const TEST_CARD_ID = 'strike' as CardId

function makeCombatStartPayload(): CombatStartPayload {
  return { enemyId: TEST_ENEMY_ID }
}

describe('EventBusImpl', () => {
  let bus: EventBusImpl

  beforeEach(() => {
    bus = new EventBusImpl()
  })

  afterEach(() => {
    bus.clear()
  })

  describe('on / emit', () => {
    it('ハンドラが emit で呼ばれること', () => {
      const handler = vi.fn()
      bus.on('combatStart', handler)
      const payload = makeCombatStartPayload()
      bus.emit('combatStart', payload)
      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith(payload)
    })

    it('複数ハンドラが全て呼ばれること', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('combatStart', handler1)
      bus.on('combatStart', handler2)
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler1).toHaveBeenCalledOnce()
      expect(handler2).toHaveBeenCalledOnce()
    })

    it('ハンドラが登録されていない場合 emit は何もしないこと', () => {
      expect(() => bus.emit('combatStart', makeCombatStartPayload())).not.toThrow()
    })

    it('React→Phaser イベント（playCardAnimation）が正しく配送されること', () => {
      const handler = vi.fn()
      bus.on('playCardAnimation', handler)
      const payload: PlayCardAnimationPayload = {
        cardId: TEST_CARD_ID,
        target: { kind: 'enemy', id: TEST_ENEMY_ID },
        animationType: 'attack',
      }
      bus.emit('playCardAnimation', payload)
      expect(handler).toHaveBeenCalledWith(payload)
    })
  })

  describe('off', () => {
    it('購読解除後にハンドラが呼ばれないこと', () => {
      const handler = vi.fn()
      bus.on('combatStart', handler)
      bus.off('combatStart', handler)
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler).not.toHaveBeenCalled()
    })

    it('存在しないハンドラの off は無視されること', () => {
      const handler = vi.fn()
      expect(() => bus.off('combatStart', handler)).not.toThrow()
    })

    it('全ハンドラ解除後も emit が安全に動作すること', () => {
      const handler = vi.fn()
      bus.on('combatStart', handler)
      bus.off('combatStart', handler)
      expect(() => bus.emit('combatStart', makeCombatStartPayload())).not.toThrow()
    })
  })

  describe('on が返す Unsubscribe', () => {
    it('Unsubscribe を呼ぶと購読解除されること', () => {
      const handler = vi.fn()
      const unsub = bus.on('combatStart', handler)
      unsub()
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('once', () => {
    it('初回のみ呼ばれ、2回目は無視されること', () => {
      const handler = vi.fn()
      bus.once('combatStart', handler)
      bus.emit('combatStart', makeCombatStartPayload())
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler).toHaveBeenCalledOnce()
    })

    it('once の Unsubscribe: 発火前にキャンセルできること', () => {
      const handler = vi.fn()
      const unsub = bus.once('combatStart', handler)
      unsub()
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler).not.toHaveBeenCalled()
    })

    it('once 登録後に off(event, handler) を直接呼んでも購読解除されないこと（内部ラッパーとの参照差異）', () => {
      // once は内部でラッパー関数を生成するため、元の handler を off に渡しても解除されない。
      // キャンセルには once が返す Unsubscribe を使うこと（JSDoc 参照）。
      const handler = vi.fn()
      bus.once('combatStart', handler)
      // Attempt to unsubscribe via the original handler reference (will NOT work)
      bus.off('combatStart', handler)
      bus.emit('combatStart', makeCombatStartPayload())
      // Handler still fires because off() targeted the original ref, not the wrapper
      expect(handler).toHaveBeenCalledOnce()
    })
  })

  describe('emit 中の off（安全性）', () => {
    it('emit 中にハンドラ内から自身を off しても残りのハンドラが呼ばれること', () => {
      const handler2 = vi.fn()
      const handler1 = vi.fn(() => {
        bus.off('combatStart', handler1)
      })
      bus.on('combatStart', handler1)
      bus.on('combatStart', handler2)
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler1).toHaveBeenCalledOnce()
      expect(handler2).toHaveBeenCalledOnce()
    })

    it('emit 中にハンドラ内から別ハンドラを off しても別ハンドラは同 emit 内で呼ばれること', () => {
      // スナップショット方式のため、emit 開始後に登録解除されたハンドラも当該 emit では実行される
      const handler2 = vi.fn()
      const handler1 = vi.fn(() => {
        bus.off('combatStart', handler2)
      })
      bus.on('combatStart', handler1)
      bus.on('combatStart', handler2)
      bus.emit('combatStart', makeCombatStartPayload())
      expect(handler1).toHaveBeenCalledOnce()
      // handler2 was removed during emit, but snapshot ensures it still fires this round
      expect(handler2).toHaveBeenCalledOnce()
    })
  })

  describe('clear', () => {
    it('全ハンドラが除去されること', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('combatStart', handler1)
      bus.on('combatEnd', handler2)
      bus.clear()
      bus.emit('combatStart', makeCombatStartPayload())
      bus.emit('combatEnd', { playerWon: true })
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('型安全性', () => {
    it('異なるイベントのハンドラが混在しないこと', () => {
      const startHandler = vi.fn()
      const endHandler = vi.fn()
      bus.on('combatStart', startHandler)
      bus.on('combatEnd', endHandler)

      const endPayload: CombatEndPayload = { playerWon: true }
      bus.emit('combatEnd', endPayload)

      expect(startHandler).not.toHaveBeenCalled()
      expect(endHandler).toHaveBeenCalledWith(endPayload)
    })
  })
})
