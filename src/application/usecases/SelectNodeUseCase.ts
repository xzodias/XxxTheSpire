import type { MapNode } from '../../domain/entities/MapNode'
import type { NodeId } from '../../shared/types'
import { type Result, ok, err } from '../../shared/types'

export type SelectNodeError = 'node_not_found' | 'not_accessible' | 'current_node_not_found'

export interface SelectNodeParams {
  readonly map: ReadonlyArray<ReadonlyArray<MapNode>>
  readonly currentNodeId: NodeId | null
  readonly targetNodeId: NodeId
}

/**
 * マップノード選択ユースケース
 *
 * 指定ノードへの移動が可能かを検証し、可能であれば選択先ノードを返す。
 *
 * 検証ルール:
 * - currentNodeId === null の場合: floor 0 のノードのみ選択可能（ゲーム開始時）
 * - currentNodeId !== null の場合: currentNode.connections に含まれるノードのみ選択可能
 *
 * 参照してはいけない層: infrastructure, presentation
 */
export class SelectNodeUseCase {
  execute(params: SelectNodeParams): Result<MapNode, SelectNodeError> {
    const { map, currentNodeId, targetNodeId } = params

    // 全ノードを検索
    const targetNode = this.findNode(map, targetNodeId)
    if (targetNode === undefined) return err('node_not_found')

    if (currentNodeId === null) {
      // ゲーム開始時: floor 0 のノードのみ選択可能
      if (targetNode.floor !== 0) return err('not_accessible')
      return ok(targetNode)
    }

    // 移動中: 接続ノードのみ選択可能
    const currentNode = this.findNode(map, currentNodeId)
    if (currentNode === undefined) return err('current_node_not_found')

    if (!currentNode.connections.includes(targetNodeId)) return err('not_accessible')

    return ok(targetNode)
  }

  private findNode(
    map: ReadonlyArray<ReadonlyArray<MapNode>>,
    nodeId: NodeId,
  ): MapNode | undefined {
    for (const floor of map) {
      for (const node of floor) {
        if (node.id === nodeId) return node
      }
    }
    return undefined
  }
}
