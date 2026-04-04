import { describe, it, expect } from 'vitest'
import { SelectNodeUseCase } from '../../../src/application/usecases/SelectNodeUseCase'
import type { MapNode } from '../../../src/domain/entities/MapNode'
import { NodeType } from '../../../src/shared/types'
import type { NodeId } from '../../../src/shared/types'

// --- Test helpers ---

function makeNode(
  id: string,
  floor: number,
  connections: string[] = [],
  type: NodeType = NodeType.Combat,
): MapNode {
  return {
    id: id as NodeId,
    type,
    floor,
    connections: connections.map((c) => c as NodeId),
    visited: false,
  }
}

/**
 * 2フロアのシンプルなマップ:
 *   Floor 0: node-0 (Combat)
 *   Floor 1: node-1 (Combat), node-2 (Elite)
 *   node-0 → [node-1, node-2]
 */
const SIMPLE_MAP: MapNode[][] = [
  [makeNode('node-0', 0, ['node-1', 'node-2'], NodeType.Combat)],
  [makeNode('node-1', 1, [], NodeType.Combat), makeNode('node-2', 1, [], NodeType.Elite)],
]

const node0 = SIMPLE_MAP[0]![0]!
const node1 = SIMPLE_MAP[1]![0]!
const node2 = SIMPLE_MAP[1]![1]!

// --- Tests ---

describe('SelectNodeUseCase', () => {
  const usecase = new SelectNodeUseCase()

  describe('初回選択（currentNodeId === null）', () => {
    it('1. floor 0 のノードを選択できる', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: null,
        targetNodeId: node0.id,
      })
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.id).toBe('node-0')
    })

    it('2. floor 0 以外のノードは選択不可 → not_accessible', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: null,
        targetNodeId: node1.id,
      })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('not_accessible')
    })

    it('3. 存在しないノードIDは node_not_found', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: null,
        targetNodeId: 'non-existent' as NodeId,
      })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('node_not_found')
    })
  })

  describe('移動先選択（currentNodeId !== null）', () => {
    it('4. 接続されているノードへ移動できる（node-0 → node-1）', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: node0.id,
        targetNodeId: node1.id,
      })
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.id).toBe('node-1')
    })

    it('5. 接続されているノードへ移動できる（node-0 → node-2）', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: node0.id,
        targetNodeId: node2.id,
      })
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.error)
      expect(result.value.id).toBe('node-2')
    })

    it('6. 接続されていないノードへの移動は not_accessible', () => {
      // node-1 は node-2 と接続されていない
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: node1.id,
        targetNodeId: node2.id,
      })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('not_accessible')
    })

    it('7. 存在しないcurrentNodeIdは current_node_not_found', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: 'ghost-node' as NodeId,
        targetNodeId: node1.id,
      })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('current_node_not_found')
    })

    it('8. 存在しないtargetNodeIdは node_not_found', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: node0.id,
        targetNodeId: 'ghost-node' as NodeId,
      })
      expect(result.ok).toBe(false)
      if (result.ok) throw new Error('Expected error')
      expect(result.error).toBe('node_not_found')
    })
  })

  describe('戻り値の検証', () => {
    it('9. 返却されるノードは targetNodeId と一致する', () => {
      const result = usecase.execute({
        map: SIMPLE_MAP,
        currentNodeId: node0.id,
        targetNodeId: node2.id,
      })
      if (!result.ok) throw new Error(result.error)
      expect(result.value.id).toBe(node2.id)
      expect(result.value.type).toBe(NodeType.Elite)
      expect(result.value.floor).toBe(1)
    })
  })
})
