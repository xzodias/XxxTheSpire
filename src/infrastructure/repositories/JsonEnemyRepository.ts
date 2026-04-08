import { z } from 'zod'
import { type EnemyDefinition } from '../../domain/entities/EnemyDefinition'
import { type IEnemyRepository } from '../../domain/interfaces/IEnemyRepository'
import { type Intent } from '../../domain/entities/Enemy'
import { type EnemyId } from '../../shared/types'
import { EnemySchema, type EnemyIntentRaw, type EnemyRaw } from '../data/schemas'
import enemiesData from '../data/enemies.json'

/**
 * EnemyIntentRaw → Intent へのマッパー
 *
 * EnemyIntentSchema の type は IntentType と同一のリテラルユニオン型のため、
 * キャストなしで直接代入できる。
 */
function toIntent(raw: EnemyIntentRaw): Intent {
  return {
    type: raw.type,
    ...(raw.value !== undefined ? { value: raw.value } : {}),
  }
}

/**
 * EnemyRaw → EnemyDefinition へのマッパー
 */
function toEnemyDefinition(raw: EnemyRaw): EnemyDefinition {
  return {
    id: raw.id as EnemyId,
    name: raw.name,
    hp: {
      min: raw.hp_min,
      max: raw.hp_max,
    },
    intents: raw.intents.map(toIntent),
  }
}

/**
 * JSONファイルベースの敵リポジトリ
 *
 * enemies.json を z.array(EnemySchema).safeParse() で一括検証し、
 * EnemyDefinition として返す。バリデーション失敗時はわかりやすいエラーをスローする。
 * 参照可能な層: domain/interfaces, domain/entities, shared/types,
 *               infrastructure/data
 */
export class JsonEnemyRepository implements IEnemyRepository {
  private readonly enemies: ReadonlyArray<EnemyDefinition>

  constructor() {
    const result = z.array(EnemySchema).safeParse(enemiesData)
    if (!result.success) {
      throw new Error(`enemies.json のパースに失敗しました: ${result.error.message}`)
    }
    this.enemies = result.data.map(toEnemyDefinition)
  }

  findById(enemyId: EnemyId): EnemyDefinition | undefined {
    return this.enemies.find((e) => e.id === enemyId)
  }

  findAll(): ReadonlyArray<EnemyDefinition> {
    return this.enemies
  }
}
