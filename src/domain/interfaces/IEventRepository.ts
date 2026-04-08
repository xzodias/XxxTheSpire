import { type EventId } from '../../shared/types'
import { type EventDefinition } from '../entities/EventDefinition'

/**
 * イベントリポジトリインターフェース
 *
 * イベントマスターデータ取得の契約。
 * 参照可能な層: domain/entities のみ
 */
export interface IEventRepository {
  findById(eventId: EventId): EventDefinition | undefined
  findAll(): ReadonlyArray<EventDefinition>
}
