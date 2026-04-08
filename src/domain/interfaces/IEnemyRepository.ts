import { type EnemyId } from '../../shared/types'
import { type EnemyDefinition } from '../entities/EnemyDefinition'

/**
 * 敵リポジトリインターフェース
 *
 * 敵マスターデータ取得の契約。
 * 参照可能な層: domain/entities のみ
 */
export interface IEnemyRepository {
  findById(enemyId: EnemyId): EnemyDefinition | undefined
  findAll(): ReadonlyArray<EnemyDefinition>
}
