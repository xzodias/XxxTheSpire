/**
 * マップノード種別列挙型
 *
 * - Combat : 通常戦闘
 * - Elite  : エリート戦闘（強敵・高報酬）
 * - Event  : イベント（選択肢あり）
 * - Shop   : ショップ（カード・レリック購入）
 * - Rest   : 休憩所（HP回復またはカード強化）
 * - Boss   : ボス戦闘（Act末尾）
 *
 * 外部依存ゼロ（import不要）
 */
export const NodeType = {
  Combat: 'Combat',
  Elite: 'Elite',
  Event: 'Event',
  Shop: 'Shop',
  Rest: 'Rest',
  Boss: 'Boss',
} as const

export type NodeType = (typeof NodeType)[keyof typeof NodeType]
