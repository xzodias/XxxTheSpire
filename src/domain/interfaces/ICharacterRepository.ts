import { type CharacterId } from '../../shared/types'
import { type CharacterDefinition } from '../entities/CharacterDefinition'

/**
 * キャラクターリポジトリインターフェース
 *
 * キャラクターマスターデータ取得の契約。
 * 参照可能な層: domain/entities のみ
 */
export interface ICharacterRepository {
  findById(characterId: CharacterId): CharacterDefinition | undefined
  findAll(): readonly CharacterDefinition[]
}
