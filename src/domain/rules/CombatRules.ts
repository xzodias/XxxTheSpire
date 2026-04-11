import { type Combatant } from '../entities/Character'
import { StatusEffectType } from '../entities/StatusEffect'

/**
 * 攻撃者・対象の状態効果を考慮してダメージ量を計算する（純粋関数）。
 *
 * 適用順:
 *   1. base + strength(stacks)
 *   2. floor(×0.75) if attacker has Weak (duration > 0)
 *   3. floor(×1.5)  if target has Vulnerable (duration > 0)
 *
 * @param baseAmount - カードのベースダメージ（非負整数）
 * @param attacker   - 攻撃するキャラクター
 * @param target     - ダメージを受けるキャラクター
 * @returns 最終ダメージ量（0以上）
 *
 * 参照可能な層: domain/entities のみ
 */
export function calculateDamage(
  baseAmount: number,
  attacker: Combatant,
  target: Combatant,
): number {
  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new Error(
      `calculateDamage: baseAmount must be a non-negative finite number, got ${baseAmount}`,
    )
  }

  const strength =
    attacker.statusEffects.find((se) => se.type === StatusEffectType.Strength)?.stacks ?? 0
  const isWeak =
    (attacker.statusEffects.find((se) => se.type === StatusEffectType.Weak)?.duration ?? 0) > 0
  const isVulnerable =
    (target.statusEffects.find((se) => se.type === StatusEffectType.Vulnerable)?.duration ?? 0) > 0

  let damage = baseAmount + strength
  if (isWeak) damage = Math.floor(damage * 0.75)
  if (isVulnerable) damage = Math.floor(damage * 1.5)
  return Math.max(0, damage)
}

/**
 * 防御者の状態効果を考慮してブロック獲得量を計算する（純粋関数）。
 *
 * 適用: base + dexterity(stacks)
 *
 * @param baseAmount - カードのベースブロック量（非負整数）
 * @param defender   - ブロックを得るキャラクター
 * @returns 最終ブロック量（0以上）
 *
 * 参照可能な層: domain/entities のみ
 */
export function calculateBlock(baseAmount: number, defender: Combatant): number {
  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new Error(
      `calculateBlock: baseAmount must be a non-negative finite number, got ${baseAmount}`,
    )
  }

  const dexterity =
    defender.statusEffects.find((se) => se.type === StatusEffectType.Dexterity)?.stacks ?? 0
  return Math.max(0, baseAmount + dexterity)
}

/**
 * キャラクターにダメージを適用した新しいインスタンスを返す（純粋関数）。
 *
 * ダメージはブロックで先に吸収され、残りが HP に適用される（ブロック先行消費ルール）。
 * Player・Enemy 双方で再利用可能な汎用ダメージ計算。
 *
 * @param combatant - ダメージを受けるキャラクター（イミュータブル）
 * @param amount    - ダメージ量（非負整数）
 * @returns 更新後の新しいキャラクターオブジェクト
 *
 * 参照可能な層: domain/entities のみ
 */
export function applyDamageToCharacter<T extends Combatant>(combatant: T, amount: number): T {
  const { block, remainingDamage } = combatant.block.absorb(amount)
  const health = combatant.health.takeDamage(remainingDamage)
  return { ...combatant, block, health }
}
