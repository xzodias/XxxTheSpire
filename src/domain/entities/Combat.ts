import { type CombatPhase } from '../enums/CombatPhase'
import { type Enemy } from './Enemy'
import { type Player } from './Player'

/**
 * 戦闘状態エンティティ
 *
 * 1回の戦闘における現在の状態スナップショットを表すエンティティ。
 * 全プロパティは readonly（イミュータビリティ必須）。
 *
 * - activePowers フィールドは Combat に持たせない設計。
 *   Power（筋力・アーティファクト等）は Player および Enemy 各自の
 *   powers: readonly ActivePower[] プロパティとして保持する。
 * - turn は 1 始まりのターン数を表す
 *
 * 参照可能な層: domain/entities, domain/enums のみ
 */
export interface Combat {
  readonly player: Player
  readonly enemies: readonly Enemy[]
  readonly turn: number
  readonly phase: CombatPhase
}
