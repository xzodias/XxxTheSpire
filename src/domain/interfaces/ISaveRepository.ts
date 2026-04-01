import { type Player } from '../entities/Player'

/**
 * セーブリポジトリインターフェース
 *
 * ラン途中のセーブデータ保存・読込の契約。
 * 参照可能な層: domain/entities のみ
 */
export interface ISaveRepository {
  save(state: Player): void
  load(): Player | null
  delete(): void
  exists(): boolean
}
