import { type PowerId } from '../../shared/types'
import { type Health } from '../value-objects/Health'
import { type Block } from '../value-objects/Block'
import { type StatusEffect } from './StatusEffect'

/**
 * アクティブパワー
 *
 * 戦闘中に付与されているパワー（筋力・アーティファクト等の永続バフ）の状態。
 * id はパワーの種別識別子、stacks は現在のスタック数を表す。
 */
export type ActivePower = {
  readonly id: PowerId
  readonly stacks: number
}

/**
 * Combatant インターフェース
 *
 * Player と Enemy の共通操作を抽象化する。
 * Power は Combatant ではなく Player/Enemy 各自が保持する設計。
 * これにより複数プレイヤー対応や敵 Power への拡張が容易になる。
 */
export interface Combatant {
  readonly health: Health
  readonly block: Block
  readonly powers: readonly ActivePower[]
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
