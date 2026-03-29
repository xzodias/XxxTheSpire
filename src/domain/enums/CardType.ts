/**
 * カード種別列挙型
 *
 * - Attack : 敵にダメージを与えるカード
 * - Skill  : 補助・防御・特殊効果のカード
 * - Power  : 永続的な効果を付与するカード
 * - Status : デッキに混入する妨害カード（プレイ不可）
 * - Curse  : デッキに混入する呪いカード（マイナス効果）
 *
 * 外部依存ゼロ（import不要）
 */
export const CardType = {
  Attack: 'Attack',
  Skill: 'Skill',
  Power: 'Power',
  Status: 'Status',
  Curse: 'Curse',
} as const

export type CardType = (typeof CardType)[keyof typeof CardType]
