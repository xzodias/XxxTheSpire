/**
 * 戦闘ステートマシン（アプリケーション層）
 *
 * CombatPhase 間の遷移バリデーションを提供するステートレスな関数群。
 * 状態を保持しないため、クラスではなく純粋関数として実装する。
 *
 * 参照可能な層: domain, application/state-machine
 */
import { CombatPhase, VALID_TRANSITIONS } from './CombatPhase'

/**
 * 指定された遷移が有効かどうかを返す。
 *
 * @param current - 現在のフェーズ
 * @param next    - 遷移先のフェーズ
 * @returns 遷移が有効なら true、無効なら false
 */
export function canTransition(current: CombatPhase, next: CombatPhase): boolean {
  return VALID_TRANSITIONS[current].includes(next)
}

/**
 * 遷移を実行して次のフェーズを返す。
 * 無効な遷移の場合は Error をスローする。
 *
 * @param current - 現在のフェーズ
 * @param next    - 遷移先のフェーズ
 * @returns 次のフェーズ（next と同一）
 * @throws Error 遷移が無効な場合。メッセージには current と next の名前が含まれる。
 */
export function transition(current: CombatPhase, next: CombatPhase): CombatPhase {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid combat phase transition: ${current} -> ${next}`)
  }
  return next
}
