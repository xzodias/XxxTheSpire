import { type NodeId } from '../../shared/types'
import { type NodeType } from '../enums/NodeType'

/**
 * マップノードエンティティ
 *
 * マップ上の各ノード（部屋）のデータ構造。
 * id により一意識別され、type でノード種別（戦闘・イベント等）を表す。
 * connections は次のノードへの NodeId 参照の配列。
 * visited は訪問済みフラグ。
 *
 * 参照可能な層: domain/enums のみ
 */
export interface MapNode {
  readonly id: NodeId
  readonly type: NodeType
  readonly floor: number
  readonly connections: readonly NodeId[]
  readonly visited: boolean
}
