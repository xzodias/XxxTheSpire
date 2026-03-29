/**
 * ターゲット種別列挙型
 *
 * - Single : 単体ターゲット（敵1体）
 * - All    : 全体ターゲット（全敵）
 * - Self   : 自身（プレイヤー）
 * - Random : ランダムターゲット
 *
 * 外部依存ゼロ（import不要）
 */
export const TargetType = {
  Single: 'Single',
  All: 'All',
  Self: 'Self',
  Random: 'Random',
} as const

export type TargetType = (typeof TargetType)[keyof typeof TargetType]
