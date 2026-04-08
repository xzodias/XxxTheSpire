import { z } from 'zod'
import { type GameEvent, type Relic, type StateWithPlayer } from '../../domain/entities/Relic'
import { Rarity } from '../../domain/enums/Rarity'
import { type IRelicRepository } from '../../domain/interfaces/IRelicRepository'
import { type RelicId } from '../../shared/types'
import { RelicSchema, type RelicRaw } from '../data/schemas'
import ironcladRelics from '../data/relics.json'

/**
 * RelicRaw（snake_case）→ Relic へのマッパー
 *
 * JSONには triggers・onTrigger を持たないため、デフォルト実装を付与する。
 * - triggers: [] — 発火するイベントなし
 * - onTrigger: no-op — 状態をそのまま返す
 *
 * TODO: レリック個別の振る舞い実装時（T64等）に RelicFactory へ移行すること。
 */
function toRelicEntity(raw: RelicRaw): Relic {
  return {
    id: raw.id as RelicId,
    name: raw.name,
    description: raw.description,
    rarity: raw.rarity,
    triggers: [],
    onTrigger: <S extends StateWithPlayer>(_event: GameEvent, state: S): S => state,
  }
}

/**
 * JSONファイルベースのレリックリポジトリ
 *
 * JSONファイルをZodスキーマで検証し、Relicエンティティとして返す。
 * 参照可能な層: domain/interfaces, domain/entities, domain/enums,
 *               domain/value-objects, infrastructure/data
 */
export class JsonRelicRepository implements IRelicRepository {
  private readonly relics: readonly Relic[]

  constructor() {
    this.relics = z.array(RelicSchema).parse(ironcladRelics).map(toRelicEntity)
  }

  findById(id: string): Relic | undefined {
    return this.relics.find((relic) => relic.id === id)
  }

  findAll(): readonly Relic[] {
    return this.relics
  }

  findByRarity(rarity: Rarity): readonly Relic[] {
    return this.relics.filter((relic) => relic.rarity === rarity)
  }
}
