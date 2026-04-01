import { describe, it, expect } from 'vitest'
import {
  canTransition,
  transition,
} from '../../../src/application/state-machine/CombatStateMachine'
import { CombatPhase } from '../../../src/application/state-machine/CombatPhase'

// ---------------------------------------------------------------------------
// canTransition
// ---------------------------------------------------------------------------

describe('canTransition', () => {
  describe('有効な遷移は true を返す', () => {
    it('PlayerTurnStart -> PlayerAction', () => {
      expect(canTransition(CombatPhase.PlayerTurnStart, CombatPhase.PlayerAction)).toBe(true)
    })

    it('PlayerAction -> PlayerTurnEnd', () => {
      expect(canTransition(CombatPhase.PlayerAction, CombatPhase.PlayerTurnEnd)).toBe(true)
    })

    it('PlayerAction -> Victory', () => {
      expect(canTransition(CombatPhase.PlayerAction, CombatPhase.Victory)).toBe(true)
    })

    it('PlayerAction -> Defeat', () => {
      expect(canTransition(CombatPhase.PlayerAction, CombatPhase.Defeat)).toBe(true)
    })

    it('PlayerTurnEnd -> EnemyTurn', () => {
      expect(canTransition(CombatPhase.PlayerTurnEnd, CombatPhase.EnemyTurn)).toBe(true)
    })

    it('EnemyTurn -> PlayerTurnStart', () => {
      expect(canTransition(CombatPhase.EnemyTurn, CombatPhase.PlayerTurnStart)).toBe(true)
    })

    it('EnemyTurn -> Victory', () => {
      expect(canTransition(CombatPhase.EnemyTurn, CombatPhase.Victory)).toBe(true)
    })

    it('EnemyTurn -> Defeat', () => {
      expect(canTransition(CombatPhase.EnemyTurn, CombatPhase.Defeat)).toBe(true)
    })
  })

  describe('無効な遷移は false を返す', () => {
    it('PlayerTurnStart -> PlayerTurnEnd (スキップ不可)', () => {
      expect(canTransition(CombatPhase.PlayerTurnStart, CombatPhase.PlayerTurnEnd)).toBe(false)
    })

    it('PlayerTurnStart -> EnemyTurn (スキップ不可)', () => {
      expect(canTransition(CombatPhase.PlayerTurnStart, CombatPhase.EnemyTurn)).toBe(false)
    })

    it('PlayerTurnStart -> Victory (PlayerAction を経由せずに終了不可)', () => {
      expect(canTransition(CombatPhase.PlayerTurnStart, CombatPhase.Victory)).toBe(false)
    })

    it('PlayerTurnStart -> Defeat', () => {
      expect(canTransition(CombatPhase.PlayerTurnStart, CombatPhase.Defeat)).toBe(false)
    })

    it('PlayerAction -> PlayerTurnStart (逆戻り不可)', () => {
      expect(canTransition(CombatPhase.PlayerAction, CombatPhase.PlayerTurnStart)).toBe(false)
    })

    it('PlayerAction -> EnemyTurn (PlayerTurnEnd を経由せずに遷移不可)', () => {
      expect(canTransition(CombatPhase.PlayerAction, CombatPhase.EnemyTurn)).toBe(false)
    })

    it('PlayerTurnEnd -> PlayerTurnStart (逆戻り不可)', () => {
      expect(canTransition(CombatPhase.PlayerTurnEnd, CombatPhase.PlayerTurnStart)).toBe(false)
    })

    it('PlayerTurnEnd -> Victory', () => {
      expect(canTransition(CombatPhase.PlayerTurnEnd, CombatPhase.Victory)).toBe(false)
    })

    it('PlayerTurnEnd -> Defeat', () => {
      expect(canTransition(CombatPhase.PlayerTurnEnd, CombatPhase.Defeat)).toBe(false)
    })

    it('EnemyTurn -> PlayerAction (逆戻り不可)', () => {
      expect(canTransition(CombatPhase.EnemyTurn, CombatPhase.PlayerAction)).toBe(false)
    })

    it('EnemyTurn -> PlayerTurnEnd (逆戻り不可)', () => {
      expect(canTransition(CombatPhase.EnemyTurn, CombatPhase.PlayerTurnEnd)).toBe(false)
    })
  })

  describe('終端状態からの遷移は全て false', () => {
    const terminalPhases = [CombatPhase.Victory, CombatPhase.Defeat]
    const allPhases = Object.values(CombatPhase)

    terminalPhases.forEach((terminal) => {
      allPhases.forEach((next) => {
        it(`${terminal} -> ${next}`, () => {
          expect(canTransition(terminal, next)).toBe(false)
        })
      })
    })
  })

  describe('自己遷移（同一フェーズ）は false', () => {
    Object.values(CombatPhase).forEach((phase) => {
      it(`${phase} -> ${phase}`, () => {
        expect(canTransition(phase, phase)).toBe(false)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// transition
// ---------------------------------------------------------------------------

describe('transition', () => {
  describe('有効な遷移は次のフェーズを返す', () => {
    it('PlayerTurnStart -> PlayerAction', () => {
      expect(transition(CombatPhase.PlayerTurnStart, CombatPhase.PlayerAction)).toBe(
        CombatPhase.PlayerAction,
      )
    })

    it('PlayerAction -> PlayerTurnEnd', () => {
      expect(transition(CombatPhase.PlayerAction, CombatPhase.PlayerTurnEnd)).toBe(
        CombatPhase.PlayerTurnEnd,
      )
    })

    it('PlayerAction -> Victory', () => {
      expect(transition(CombatPhase.PlayerAction, CombatPhase.Victory)).toBe(CombatPhase.Victory)
    })

    it('PlayerAction -> Defeat', () => {
      expect(transition(CombatPhase.PlayerAction, CombatPhase.Defeat)).toBe(CombatPhase.Defeat)
    })

    it('PlayerTurnEnd -> EnemyTurn', () => {
      expect(transition(CombatPhase.PlayerTurnEnd, CombatPhase.EnemyTurn)).toBe(
        CombatPhase.EnemyTurn,
      )
    })

    it('EnemyTurn -> PlayerTurnStart', () => {
      expect(transition(CombatPhase.EnemyTurn, CombatPhase.PlayerTurnStart)).toBe(
        CombatPhase.PlayerTurnStart,
      )
    })

    it('EnemyTurn -> Victory', () => {
      expect(transition(CombatPhase.EnemyTurn, CombatPhase.Victory)).toBe(CombatPhase.Victory)
    })

    it('EnemyTurn -> Defeat', () => {
      expect(transition(CombatPhase.EnemyTurn, CombatPhase.Defeat)).toBe(CombatPhase.Defeat)
    })
  })

  describe('無効な遷移は Error をスローする', () => {
    it('PlayerTurnStart -> PlayerTurnEnd: エラーをスローする', () => {
      expect(() => transition(CombatPhase.PlayerTurnStart, CombatPhase.PlayerTurnEnd)).toThrow()
    })

    it('PlayerAction -> PlayerTurnStart: エラーをスローする', () => {
      expect(() => transition(CombatPhase.PlayerAction, CombatPhase.PlayerTurnStart)).toThrow()
    })

    it('PlayerTurnEnd -> Victory: エラーをスローする', () => {
      expect(() => transition(CombatPhase.PlayerTurnEnd, CombatPhase.Victory)).toThrow()
    })

    it('EnemyTurn -> PlayerAction: エラーをスローする', () => {
      expect(() => transition(CombatPhase.EnemyTurn, CombatPhase.PlayerAction)).toThrow()
    })
  })

  describe('終端状態からのスローにはフェーズ名が含まれる', () => {
    it('Victory -> PlayerTurnStart: エラーメッセージに Victory と PlayerTurnStart が含まれる', () => {
      expect(() => transition(CombatPhase.Victory, CombatPhase.PlayerTurnStart)).toThrowError(
        /Victory.*PlayerTurnStart/,
      )
    })

    it('Defeat -> EnemyTurn: エラーメッセージに Defeat と EnemyTurn が含まれる', () => {
      expect(() => transition(CombatPhase.Defeat, CombatPhase.EnemyTurn)).toThrowError(
        /Defeat.*EnemyTurn/,
      )
    })
  })

  describe('任意の無効遷移のエラーメッセージに current と next の名前が含まれる', () => {
    it('PlayerTurnStart -> EnemyTurn', () => {
      expect(() => transition(CombatPhase.PlayerTurnStart, CombatPhase.EnemyTurn)).toThrowError(
        /PlayerTurnStart.*EnemyTurn/,
      )
    })

    it('PlayerAction -> PlayerTurnStart', () => {
      expect(() => transition(CombatPhase.PlayerAction, CombatPhase.PlayerTurnStart)).toThrowError(
        /PlayerAction.*PlayerTurnStart/,
      )
    })
  })
})
