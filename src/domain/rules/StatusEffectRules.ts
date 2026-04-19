import { type Combatant } from '../entities/Character'
import {
  type StatusEffect,
  type StatusEffectType,
  StackingStatusEffectTypes,
} from '../entities/StatusEffect'
import { type StatusEffectId } from '../../shared/types'

/**
 * 状態効果ルール（ドメイン層）
 *
 * 受動型状態効果（Strength/Dexterity/Artifact/Vulnerable/Weak）の
 * スタック・持続ターン管理に関する純粋関数群。
 *
 * トリガー型効果（Poison/Burn 等）は Power（Observer パターン）として別途実装する。
 * 参照可能な層: domain/entities のみ
 */

const STACKING_TYPE_SET: ReadonlySet<string> = new Set(StackingStatusEffectTypes)

function isStackingType(type: StatusEffectType): boolean {
  return STACKING_TYPE_SET.has(type)
}

/**
 * Combatant に状態効果を付与した新しいオブジェクトを返す（純粋関数）。
 *
 * - スタック型（Strength/Dexterity/Artifact）: stacks を加算
 * - 持続ターン型（Vulnerable/Weak）: duration を加算
 * - 既存の同種エフェクトが存在する場合は加算、なければ新規追加
 * - amount は 0 以上の整数を前提とする（負値は効果を持たない）
 *
 * @param combatant - 状態効果を付与するキャラクター（イミュータブル）
 * @param type      - 付与する状態効果の種別
 * @param amount    - 加算するスタック数または持続ターン数（0 以上）
 * @returns 更新後の新しい Combatant オブジェクト
 */
/**
 * StatusEffectType 文字列を StatusEffectId に変換する。
 *
 * 設計上の不変条件: StatusEffect.id は常に付与時の StatusEffectType 値と一致する。
 * （addStatusEffect がこの不変条件を維持する唯一の生成経路）
 *
 * 注意: StatusEffectId は `string & brand` 型のため、StatusEffectType を直接代入できない。
 * StatusEffectId を `StatusEffectType & brand` に変更すればキャストが型安全になるが、
 * shared/types が domain/entities を import することになり CA 違反になるため、現状は型アサーションを使用する。
 */
function toStatusEffectId(type: StatusEffectType): StatusEffectId {
  return type as StatusEffectId
}

export function addStatusEffect<T extends Combatant>(
  combatant: T,
  type: StatusEffectType,
  amount: number,
): T {
  if (amount < 0) {
    throw new Error(`addStatusEffect: amount must be >= 0, got ${amount}`)
  }

  const stacking = isStackingType(type)
  const existing = combatant.statusEffects.find((se) => se.type === type)

  let updatedEffects: readonly StatusEffect[]

  if (existing) {
    updatedEffects = combatant.statusEffects.map((se) =>
      se.type === type
        ? stacking
          ? { ...se, stacks: se.stacks + amount }
          : { ...se, duration: se.duration + amount }
        : se,
    )
  } else {
    if (amount === 0) {
      // amount=0 かつ既存エフェクトなし → 意味のないゼロエントリを追加しない
      return combatant
    }
    const newEffect: StatusEffect = {
      id: toStatusEffectId(type),
      name: type,
      type,
      stacks: stacking ? amount : 0,
      duration: stacking ? 0 : amount,
    }
    updatedEffects = [...combatant.statusEffects, newEffect]
  }

  return { ...combatant, statusEffects: updatedEffects }
}

/**
 * Combatant の持続ターン型状態効果を1ターン減算した新しいオブジェクトを返す（純粋関数）。
 *
 * - 持続ターン型（Vulnerable/Weak）: duration を1減算し、0以下になったら除去
 * - スタック型（Strength/Dexterity/Artifact）: 変化しない
 *
 * @param combatant - tick 対象のキャラクター（イミュータブル）
 * @returns 更新後の新しい Combatant オブジェクト
 */
export function tickStatusEffects<T extends Combatant>(combatant: T): T {
  const updatedEffects = combatant.statusEffects
    .map((se) => (isStackingType(se.type) ? se : { ...se, duration: se.duration - 1 }))
    .filter((se) => isStackingType(se.type) || se.duration > 0)

  return { ...combatant, statusEffects: updatedEffects }
}
