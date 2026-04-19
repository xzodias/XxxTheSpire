// --- Brand types ---
// Nominal typing for entity IDs to prevent accidental mixing of string IDs.
// Usage: `const id = 'strike' as CardId`

export type CardId = string & { readonly _brand: 'CardId' }
export type CharacterId = string & { readonly _brand: 'CharacterId' }
export type RelicId = string & { readonly _brand: 'RelicId' }
export type PotionId = string & { readonly _brand: 'PotionId' }
export type EnemyId = string & { readonly _brand: 'EnemyId' }
export type NodeId = string & { readonly _brand: 'NodeId' }
export type EffectId = string & { readonly _brand: 'EffectId' }
// StatusEffectId: Strength, Vulnerable, Weak, Poison 等の持続型状態効果（T12）
export type StatusEffectId = string & { readonly _brand: 'StatusEffectId' }
// PowerId: 筋力・アーティファクト等のパワー識別子（T16）
export type PowerId = string & { readonly _brand: 'PowerId' }
// EventId: マップイベントノードで発生するイベントの識別子（T133）
export type EventId = string & { readonly _brand: 'EventId' }

// --- Target (discriminated union) ---
// Represents the runtime target of an animation or effect.
// Distinct from TargetType (domain enum for card metadata) — this is a concrete runtime value.
// Used in EventBus payloads (presentation) and may be used in EffectDef (domain) in the future.
export type Target =
  | { readonly kind: 'enemy'; readonly id: EnemyId }
  | { readonly kind: 'player' }
  | { readonly kind: 'all' }

// --- Effect definition ---
// Data structure representing a card effect as stored in JSON/Card entity.
// Consumed by EffectFactory (application layer) to build executable Effect objects.
export type EffectDef = {
  readonly type: string
  readonly value: number
  readonly target?: string
  /** apply_status_effect エフェクト専用: 付与する状態効果の種別（StatusEffectType 文字列）*/
  readonly statusEffectType?: string
}

// --- Re-exports ---
export type { Result } from './Result'
export { ok, err } from './Result'
export { NodeType } from './NodeType'
export { ScreenType } from './ScreenType'
