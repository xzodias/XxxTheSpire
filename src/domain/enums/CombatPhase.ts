/**
 * 戦闘フェーズ
 *
 * 1回の戦闘における現在のフェーズを表す列挙型。
 * Combat エンティティの phase プロパティで使用する。
 */
export enum CombatPhase {
  PlayerTurn = 'PlayerTurn',
  EnemyTurn = 'EnemyTurn',
  Victory = 'Victory',
  Defeat = 'Defeat',
}
