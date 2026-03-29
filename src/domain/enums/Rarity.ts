/**
 * レアリティ列挙型
 *
 * - Common   : コモン（最も出現頻度が高い）
 * - Uncommon : アンコモン（中程度の出現頻度）
 * - Rare     : レア（最も出現頻度が低く、強力）
 *
 * 外部依存ゼロ（import不要）
 */
export const Rarity = {
  Common: 'Common',
  Uncommon: 'Uncommon',
  Rare: 'Rare',
} as const

export type Rarity = (typeof Rarity)[keyof typeof Rarity]
