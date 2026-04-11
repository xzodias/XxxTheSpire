import { z } from 'zod'
import { CardKeyword } from '../../domain/enums/CardKeyword'
import { CardType } from '../../domain/enums/CardType'
import { Rarity } from '../../domain/enums/Rarity'
import { TargetType } from '../../domain/enums/TargetType'

/**
 * エフェクト定義スキーマ
 *
 * カード効果のJSONraw形状。EffectDefと対応するが、ドメイン型には依存しない。
 * export することでリポジトリ層から個別バリデーションに使用できる。
 */
export const EffectDefSchema = z.object({
  type: z.string().min(1),
  value: z.number(),
  target: z.string().optional(),
})

export type EffectDefRaw = z.infer<typeof EffectDefSchema>

/**
 * カードJSONのraw形状スキーマ
 *
 * JSONファイルのバリデーションのみを目的とする。
 * ドメインEntityへの変換は各リポジトリ実装（T33等）の責務。
 * フィールド名はsnake_case（JSONのraw形状）。ドメイン型のcamelCaseへの
 * 変換はリポジトリのマッパー関数で行う。
 *
 * z.nativeEnum を使用することで、列挙型に新しい値が追加された際に
 * 自動的にスキーマも追従し、列挙値のドリフトを防ぐ。
 */
export const CardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  // コスト上限は設けない（X コスト等で大きな値になる可能性がある）
  cost: z.number().int().min(0),
  card_type: z.nativeEnum(CardType),
  rarity: z.nativeEnum(Rarity),
  target_type: z.nativeEnum(TargetType),
  effects: z.array(EffectDefSchema),
  upgraded: z.boolean(),
  keywords: z.array(z.nativeEnum(CardKeyword)).optional(),
})

export type CardRaw = z.infer<typeof CardSchema>

/**
 * 敵インテントのraw形状スキーマ
 *
 * 敵キャラクターが実行しうる行動パターンのJSONraw形状。
 * type は IntentType に対応する文字列リテラル。
 */
export const EnemyIntentSchema = z.object({
  type: z.enum(['attack', 'block', 'buff', 'debuff', 'unknown']),
  value: z.number().optional(),
})

export type EnemyIntentRaw = z.infer<typeof EnemyIntentSchema>

/**
 * 敵JSONのraw形状スキーマ
 *
 * 敵マスターデータのJSONraw形状。
 * - id: パース時に EnemyId ブランド型へ変換する（データ境界でのキャストを一元化）
 * - hp_min / hp_max: 戦闘開始時の初期HP範囲（両端含む正の整数）
 * - intents: 敵が実行しうる行動パターンのリスト（1件以上必須）
 * - refine: hp_min <= hp_max のクロスフィールド制約
 */
export const EnemySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    hp_min: z.number().int().positive(),
    hp_max: z.number().int().positive(),
    intents: z.array(EnemyIntentSchema).min(1),
  })
  .refine((d) => d.hp_min <= d.hp_max, {
    message: 'hp_min は hp_max 以下でなければなりません',
    path: ['hp_min'],
  })

export type EnemyRaw = z.infer<typeof EnemySchema>

/**
 * レリックJSONのraw形状スキーマ
 *
 * レリックマスターデータのJSONraw形状。
 */
export const RelicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  rarity: z.nativeEnum(Rarity),
})

export type RelicRaw = z.infer<typeof RelicSchema>

/**
 * ポーションJSONのraw形状スキーマ
 *
 * ポーションマスターデータのJSONraw形状。
 * フィールド名はsnake_case（JSONのraw形状）。ドメイン型のcamelCaseへの
 * 変換はリポジトリのマッパー関数で行う。
 */
export const PotionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  rarity: z.nativeEnum(Rarity),
  target_type: z.nativeEnum(TargetType),
})

export type PotionRaw = z.infer<typeof PotionSchema>

/**
 * スターターデッキエントリのraw形状スキーマ
 */
export const StarterDeckEntrySchema = z.object({
  id: z.string().min(1),
  count: z.number().int().positive(),
})

export type StarterDeckEntryRaw = z.infer<typeof StarterDeckEntrySchema>

/**
 * キャラクターJSONのraw形状スキーマ
 *
 * フィールド名はsnake_case（JSONのraw形状）。
 * ドメイン型のcamelCaseへの変換はリポジトリのマッパー関数で行う。
 */
export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  starting_hp: z.number().int().positive(),
  max_energy: z.number().int().positive(),
  starting_deck: z.array(StarterDeckEntrySchema).min(1),
  starting_relic_id: z.string().min(1),
})

export type CharacterRaw = z.infer<typeof CharacterSchema>

/**
 * イベントアウトカムのraw形状スキーマ（discriminated union）
 *
 * kind ごとに必須フィールドを明示することで、スキーマと domain 型の二重管理を排除。
 * - 数値効果: value 必須
 * - カード操作: card_id 必須（remove_card は任意）
 * - レリック取得: relic_id 必須
 * - nothing: 追加フィールドなし
 */
export const EventOutcomeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('gain_hp'), value: z.number() }),
  z.object({ kind: z.literal('lose_hp'), value: z.number() }),
  z.object({ kind: z.literal('gain_gold'), value: z.number() }),
  z.object({ kind: z.literal('lose_gold'), value: z.number() }),
  z.object({ kind: z.literal('add_card'), card_id: z.string().min(1) }),
  z.object({ kind: z.literal('remove_card'), card_id: z.string().optional() }),
  z.object({ kind: z.literal('gain_relic'), relic_id: z.string().min(1) }),
  z.object({ kind: z.literal('nothing') }),
])

export type EventOutcomeRaw = z.infer<typeof EventOutcomeSchema>

/**
 * イベント選択肢のraw形状スキーマ
 *
 * イベント画面でプレイヤーが選べる選択肢のJSONraw形状。
 */
export const EventChoiceSchema = z.object({
  text: z.string().min(1),
  outcomes: z.array(EventOutcomeSchema).min(1),
})

export type EventChoiceRaw = z.infer<typeof EventChoiceSchema>

/**
 * イベントJSONのraw形状スキーマ
 *
 * マップイベントノードのマスターデータのJSONraw形状。
 * フィールド名はsnake_case（JSONのraw形状）。ドメイン型のcamelCaseへの
 * 変換はリポジトリのマッパー関数で行う。
 */
export const EventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  choices: z.array(EventChoiceSchema).min(1),
})

export type EventRaw = z.infer<typeof EventSchema>
