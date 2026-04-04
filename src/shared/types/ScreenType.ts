/**
 * 画面種別
 *
 * ゲーム内で遷移可能な画面の一覧。
 * presentation 層と application 層の双方から型安全に参照できるよう shared に配置。
 *
 * 外部依存ゼロ。
 */
export const ScreenType = {
  Map: 'Map',
  Combat: 'Combat',
  Reward: 'Reward',
  Shop: 'Shop',
  Rest: 'Rest',
  Event: 'Event',
} as const

export type ScreenType = (typeof ScreenType)[keyof typeof ScreenType]
