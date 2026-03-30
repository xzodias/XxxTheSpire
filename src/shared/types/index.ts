// --- Brand types ---
// Nominal typing for entity IDs to prevent accidental mixing of string IDs.
// Usage: `const id = 'strike' as CardId`

export type CardId = string & { readonly _brand: 'CardId' }
export type RelicId = string & { readonly _brand: 'RelicId' }
export type PotionId = string & { readonly _brand: 'PotionId' }
export type EnemyId = string & { readonly _brand: 'EnemyId' }
export type NodeId = string & { readonly _brand: 'NodeId' }
export type EffectId = string & { readonly _brand: 'EffectId' }
// StatusEffectId: Strength, Vulnerable, Weak, Poison 等の持続型状態効果（T12）
export type StatusEffectId = string & { readonly _brand: 'StatusEffectId' }

// --- Effect definition ---
// Data structure representing a card effect as stored in JSON/Card entity.
// Consumed by EffectFactory (application layer) to build executable Effect objects.
export type EffectDef = {
  readonly type: string
  readonly value: number
  readonly target?: string
}

// --- Re-exports ---
export type { Result } from './Result'
export { ok, err } from './Result'
