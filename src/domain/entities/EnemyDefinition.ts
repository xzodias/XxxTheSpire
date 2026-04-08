import { type EnemyId } from '../../shared/types'
import { type Intent } from './Enemy'

/**
 * 敵HP範囲
 *
 * 戦闘開始時の初期HPをランダムに決定するための範囲。
 * 実際の初期HP決定は IRandomService を使用するファクトリ等の責務。
 */
export type EnemyHpRange = {
  readonly min: number
  readonly max: number
}

/**
 * 敵定義
 *
 * 敵キャラクター（スライム・守衛等）の静的マスターデータ。
 * 戦闘時に敵インスタンスを生成するために使用する。
 *
 * - hp: 初期HPの範囲（min/max）
 * - intents: 敵が実行しうる行動パターンのリスト
 *
 * 参照可能な層: domain/entities, shared/types のみ
 */
export type EnemyDefinition = {
  readonly id: EnemyId
  readonly name: string
  readonly hp: EnemyHpRange
  readonly intents: ReadonlyArray<Intent>
}
