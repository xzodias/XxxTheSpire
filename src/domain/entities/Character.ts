import { type Health } from '../value-objects/Health'
import { type Block } from '../value-objects/Block'
import { type StatusEffect } from './StatusEffect'
import { type Power } from './Power'

/**
 * Combatant インターフェース
 *
 * Player と Enemy の共通操作を抽象化する。
 * - statusEffects: 受動的な値参照型の効果（Strength/Dexterity/Vulnerable/Weak/Artifact）
 * - powers: トリガー型の能動的な効果（Poison/Burn 等、Observer パターンで実装）
 */
export interface Combatant {
  readonly health: Health
  readonly block: Block
  readonly powers: readonly Power[]
  readonly statusEffects: readonly StatusEffect[]
}

/**
 * キャラクターエンティティ
 *
 * Player および Enemy の共通基底となるエンティティ。
 * Combatant インターフェースを実装し、識別情報（id/name）を持つ。
 *
 * 参照可能な層: domain/value-objects, domain/entities のみ
 */
export interface Character extends Combatant {
  readonly id: string
  readonly name: string
}
