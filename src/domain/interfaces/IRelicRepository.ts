import { type Relic } from '../entities/Relic'
import { type Rarity } from '../enums/Rarity'

/**
 * レリックリポジトリインターフェース
 *
 * レリックマスターデータ取得の契約。
 * 参照可能な層: domain/entities, domain/enums のみ
 */
export interface IRelicRepository {
  findById(id: string): Relic | undefined
  findAll(): readonly Relic[]
  findByRarity(rarity: Rarity): readonly Relic[]
}
