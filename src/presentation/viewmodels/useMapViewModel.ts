import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { castDraft } from 'immer'
import type { MapNode } from '../../domain/entities/MapNode'
import type { NodeId } from '../../shared/types'
import {
  SelectNodeUseCase,
  type SelectNodeError,
} from '../../application/usecases/SelectNodeUseCase'

const selectNodeUseCase = new SelectNodeUseCase()

/**
 * マップViewModel — マップ画面の状態を管理するZustandストア
 *
 * 責務:
 * - マップデータ（map）・現在位置（currentNodeId）・選択可能ノード（selectableNodeIds）
 * - マップ初期化（initialize）・ノード選択（selectNode）アクション
 * - selectNode 失敗時のエラー状態（selectNodeError）
 *
 * 参照してはいけない層: infrastructure
 */
interface MapState {
  readonly map: ReadonlyArray<ReadonlyArray<MapNode>> | null
  readonly currentNodeId: NodeId | null
  /** 現在位置から選択可能なノードのID一覧 */
  readonly selectableNodeIds: readonly NodeId[]
  /** selectNode失敗時のエラー。成功時・未実行時は null */
  readonly selectNodeError: SelectNodeError | null
  readonly initialize: (
    map: ReadonlyArray<ReadonlyArray<MapNode>>,
    currentNodeId?: NodeId | null,
  ) => void
  readonly reset: () => void
  readonly selectNode: (targetNodeId: NodeId) => void
}

export const useMapViewModel = create<MapState>()(
  immer((set, get) => ({
    map: null,
    currentNodeId: null,
    selectableNodeIds: [],
    selectNodeError: null,

    initialize: (
      map: ReadonlyArray<ReadonlyArray<MapNode>>,
      currentNodeId: NodeId | null = null,
    ) => {
      set((draft) => {
        draft.map = castDraft(map)
        draft.currentNodeId = currentNodeId
        draft.selectableNodeIds = castDraft(computeSelectableNodeIds(map, currentNodeId))
        draft.selectNodeError = null
      })
    },

    reset: () => {
      set((draft) => {
        draft.map = null
        draft.currentNodeId = null
        draft.selectableNodeIds = []
        draft.selectNodeError = null
      })
    },

    selectNode: (targetNodeId: NodeId) => {
      const { map, currentNodeId } = get()
      if (map === null) return

      const result = selectNodeUseCase.execute({ map, currentNodeId, targetNodeId })

      if (result.ok) {
        const nextNodeId = result.value.id
        set((draft) => {
          draft.currentNodeId = nextNodeId
          // draft.map を参照することで、将来 draft.map が更新された場合でも一貫性を保つ
          draft.selectableNodeIds = castDraft(
            computeSelectableNodeIds(draft.map ?? map, nextNodeId),
          )
          draft.selectNodeError = null
        })
      } else {
        set((draft) => {
          draft.selectNodeError = result.error
        })
      }
    },
  })),
)

/**
 * 現在位置から選択可能なノードIDを計算する。
 *
 * - currentNodeId === null: floor 0 の全ノードが選択可能
 * - currentNodeId !== null: 現在ノードの connections
 */
function computeSelectableNodeIds(
  map: ReadonlyArray<ReadonlyArray<MapNode>>,
  currentNodeId: NodeId | null,
): readonly NodeId[] {
  if (currentNodeId === null) {
    return (map[0] ?? []).map((node) => node.id)
  }
  for (const floor of map) {
    for (const node of floor) {
      if (node.id === currentNodeId) return node.connections
    }
  }
  return []
}
