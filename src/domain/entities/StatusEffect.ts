import { type StatusEffectId } from '../../shared/types'

/**
 * 状態効果種別
 *
 * ダメージ計算等から受動的に参照される値のみを定義する。
 * トリガー型の効果（Poison/Burn 等）は Power（Observer パターン）として別途実装する。
 *
 * - strength    : 筋力（攻撃力増加、スタック型）
 * - dexterity   : 俊敏（ブロック量増加、スタック型）
 * - artifact    : アーティファクト（デバフ無効化、スタック型）
 * - vulnerable  : 脆弱（被ダメージ増加、持続ターン型）
 * - weak        : 縛り（攻撃力減少、持続ターン型）
 */
export const StatusEffectType = {
  Strength: 'Strength',
  Dexterity: 'Dexterity',
  Artifact: 'Artifact',
  Vulnerable: 'Vulnerable',
  Weak: 'Weak',
} as const

export type StatusEffectType = (typeof StatusEffectType)[keyof typeof StatusEffectType]

/**
 * スタック型状態効果（stacks が意味を持ち、duration は使わない）
 */
export const StackingStatusEffectTypes = [
  StatusEffectType.Strength,
  StatusEffectType.Dexterity,
  StatusEffectType.Artifact,
] as const satisfies readonly StatusEffectType[]

/**
 * 持続ターン型状態効果（duration が意味を持ち、stacks は使わない）
 */
export const DurationStatusEffectTypes = [
  StatusEffectType.Vulnerable,
  StatusEffectType.Weak,
] as const satisfies readonly StatusEffectType[]

/**
 * compile-time 網羅性チェック
 *
 * 新しい StatusEffectType を追加して StackingStatusEffectTypes か
 * DurationStatusEffectTypes への追加を忘れた場合、この行がコンパイルエラーになる。
 */
type _UncoveredStatusEffectType = Exclude<
  StatusEffectType,
  (typeof StackingStatusEffectTypes)[number] | (typeof DurationStatusEffectTypes)[number]
>
const _statusEffectExhaustiveCheck: [_UncoveredStatusEffectType] extends [never] ? true : never =
  true
void _statusEffectExhaustiveCheck

/**
 * 状態効果エンティティ
 *
 * バフ・デバフを表す。スタック型と持続ターン型の2種が存在する。
 * - スタック型  : stacks が効果量を表す（duration は 0）
 * - 持続ターン型: duration が残りターン数を表す（stacks は 0）
 *
 * 参照可能な層: shared/types のみ
 */
export interface StatusEffect {
  readonly id: StatusEffectId
  readonly name: string
  readonly type: StatusEffectType
  readonly stacks: number
  readonly duration: number
}
