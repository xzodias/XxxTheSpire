/**
 * カードキーワード列挙型
 *
 * - Exhaust  : 使用後にデッキに戻らず消耗山札へ移動する
 * - Ethereal : ターン終了時に手札から消耗される
 * - Retain   : ターン終了後も手札に残る
 *
 * 外部依存ゼロ（import不要）
 */
export const CardKeyword = {
  Exhaust: 'Exhaust',
  Ethereal: 'Ethereal',
  Retain: 'Retain',
} as const

export type CardKeyword = (typeof CardKeyword)[keyof typeof CardKeyword]
