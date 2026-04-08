import { type CardId } from '../../shared/types'
import { type Card } from '../entities/Card'
import { type Rarity } from '../enums/Rarity'

/**
 * カードリポジトリインターフェース
 *
 * カードマスターデータ取得の契約。
 * 参照可能な層: domain/entities, domain/enums, shared/types のみ
 */
export interface ICardRepository {
  findById(id: CardId): Card | undefined
  findAll(): readonly Card[]
  findByRarity(rarity: Rarity): readonly Card[]
}
