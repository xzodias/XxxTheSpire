import { type Card } from '../../domain/entities/Card'
import { Rarity } from '../../domain/enums/Rarity'
import { type ICardRepository } from '../../domain/interfaces/ICardRepository'
import { type CardId, type EffectDef } from '../../shared/types'
import { CardSchema, type CardRaw, type EffectDefRaw } from '../data/schemas'
import ironcladCards from '../data/cards/ironclad.json'

/**
 * エフェクト定義の変換
 *
 * EffectDefRaw（Zodスキーマ型）→ EffectDef（ドメイン型）へのマッピング。
 * 両者は構造的に同一だが、型安全性のために明示的に変換する。
 *
 * TODO: EffectFactory (#64) 実装時にこの関数を buildEffects(raw.effects) 呼び出しに置き換える。
 */
function mapEffects(rawEffects: readonly EffectDefRaw[]): readonly EffectDef[] {
  return rawEffects.map((e) => ({
    type: e.type,
    value: e.value,
    ...(e.target !== undefined && { target: e.target }),
  }))
}

/**
 * CardRaw（snake_case）→ Card（camelCase）へのマッパー
 *
 * フィールド変換:
 *   card_type   → type       (CardSchema により CardType enum 保証済み)
 *   target_type → targetType (CardSchema により TargetType enum 保証済み)
 *   effects     → effects    (EffectDefRaw[] → EffectDef[])
 */
function toCardEntity(raw: CardRaw): Card {
  return {
    id: raw.id as CardId,
    name: raw.name,
    description: raw.description,
    cost: raw.cost,
    type: raw.card_type,
    rarity: raw.rarity,
    targetType: raw.target_type,
    effects: mapEffects(raw.effects),
    upgraded: raw.upgraded,
  }
}

/**
 * JSONファイルベースのカードリポジトリ
 *
 * JSONファイルをZodスキーマで検証し、Cardエンティティとして返す。
 * 参照可能な層: domain/interfaces, domain/entities, domain/enums,
 *               domain/value-objects, infrastructure/data
 */
export class JsonCardRepository implements ICardRepository {
  private readonly cards: readonly Card[]

  constructor() {
    const rawCards = ironcladCards as unknown[]
    this.cards = rawCards.map((raw) => {
      const parsed = CardSchema.parse(raw)
      return toCardEntity(parsed)
    })
  }

  findById(id: string): Card | undefined {
    return this.cards.find((card) => card.id === id)
  }

  findAll(): readonly Card[] {
    return this.cards
  }

  findByRarity(rarity: Rarity): readonly Card[] {
    return this.cards.filter((card) => card.rarity === rarity)
  }
}
