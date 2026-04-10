import { type Combatant } from '../entities/Character'

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
