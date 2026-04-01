/**
 * 戦闘フェーズ（アプリケーション層）
 *
 * 1回の戦闘における細粒度の状態遷移フェーズを表す列挙型。
 * CombatStateMachine によって遷移が管理される。
 *
 * 参照可能な層: application, infrastructure, presentation
 */
export enum CombatPhase {
  PlayerTurnStart = 'PlayerTurnStart',
  PlayerAction = 'PlayerAction',
  PlayerTurnEnd = 'PlayerTurnEnd',
  EnemyTurn = 'EnemyTurn',
  Victory = 'Victory',
  Defeat = 'Defeat',
}

/**
 * 各フェーズから遷移可能なフェーズの定義
 */
export const VALID_TRANSITIONS: Readonly<Record<CombatPhase, readonly CombatPhase[]>> = {
  [CombatPhase.PlayerTurnStart]: [CombatPhase.PlayerAction],
  [CombatPhase.PlayerAction]: [CombatPhase.PlayerTurnEnd, CombatPhase.Victory, CombatPhase.Defeat],
  [CombatPhase.PlayerTurnEnd]: [CombatPhase.EnemyTurn],
  [CombatPhase.EnemyTurn]: [CombatPhase.PlayerTurnStart, CombatPhase.Victory, CombatPhase.Defeat],
  [CombatPhase.Victory]: [],
  [CombatPhase.Defeat]: [],
}
