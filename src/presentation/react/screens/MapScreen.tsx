import React, { useEffect } from 'react'
import { useMapViewModel } from '../../viewmodels/useMapViewModel'
import { EventBus, type MapNodeRenderData } from '../../phaser/EventBus'
import type { NodeId } from '../../../shared/types'
import { NodeType } from '../../../shared/types'

// ノード種別の表示ラベル
const NODE_TYPE_LABEL: Record<NodeType, string> = {
  [NodeType.Combat]: '戦闘',
  [NodeType.Elite]: 'エリート',
  [NodeType.Event]: 'イベント',
  [NodeType.Shop]: 'ショップ',
  [NodeType.Rest]: '休憩所',
  [NodeType.Boss]: 'ボス',
}

/**
 * MapScreen — マップ画面
 *
 * 現在フロア・選択可能ノードを React UI で表示する。
 * EventBus 経由で MapScene（Phaser）にマップ状態を送信し、
 * ノード選択ボタンで useMapViewModel.selectNode() を呼び出す。
 *
 * 参照してよい層: presentation（viewmodels, EventBus）のみ
 */
export function MapScreen(): React.JSX.Element {
  const { map, currentNodeId, selectableNodeIds, selectNode, selectNodeError } = useMapViewModel()

  // マップ状態が変化するたびに MapScene（Phaser）へ描画データを送信する
  useEffect(() => {
    if (map === null) return

    const nodes: MapNodeRenderData[] = map.flatMap((floor) =>
      floor.map((node, colIdx) => ({
        id: node.id,
        type: node.type,
        floor: node.floor,
        column: colIdx,
        connections: node.connections,
        visited: node.visited,
      })),
    )

    EventBus.emit('mapUpdate', { nodes, currentNodeId, selectableNodeIds })
  }, [map, currentNodeId, selectableNodeIds])

  const handleSelectNode = (nodeId: NodeId): void => {
    // nodeSelected は MapScene 側でのノードハイライト即時更新用。
    // selectNode() が成功すると selectableNodeIds が更新され、
    // useEffect の依存配列変化により mapUpdate が後続で自動発火する。
    EventBus.emit('nodeSelected', { nodeId })
    selectNode(nodeId)
  }

  if (map === null) {
    return <div style={styles.loading}>マップを読み込み中...</div>
  }

  const currentFloor = currentNodeId === null ? 0 : findNodeFloor(map, currentNodeId)
  const totalFloors = map.length

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.floorInfo}>
          Act 1 — フロア {currentFloor + 1} / {totalFloors}
        </span>
      </div>

      {selectableNodeIds.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionLabel}>移動先を選択:</p>
          <div style={styles.nodeList}>
            {selectableNodeIds.map((nodeId) => {
              const node = findNode(map, nodeId)
              if (node === undefined) return null
              return (
                <button
                  key={nodeId}
                  style={styles.nodeButton}
                  onClick={() => handleSelectNode(nodeId)}
                >
                  {NODE_TYPE_LABEL[node.type]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectableNodeIds.length === 0 && <p style={styles.hint}>進めるノードを選択してください</p>}

      {selectNodeError !== null && <p style={styles.error}>選択エラー: {selectNodeError}</p>}
    </div>
  )
}

/** マップからノードを検索する */
function findNode(
  map: ReadonlyArray<ReadonlyArray<{ readonly id: NodeId; readonly type: NodeType }>>,
  nodeId: NodeId,
): { readonly id: NodeId; readonly type: NodeType } | undefined {
  for (const floor of map) {
    const found = floor.find((n) => n.id === nodeId)
    if (found !== undefined) return found
  }
  return undefined
}

/** ノードが属するフロアインデックスを返す */
function findNodeFloor(
  map: ReadonlyArray<ReadonlyArray<{ readonly id: NodeId }>>,
  nodeId: NodeId,
): number {
  for (let i = 0; i < map.length; i++) {
    if (map[i]!.some((n) => n.id === nodeId)) return i
  }
  return 0
}

const styles = {
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'monospace',
    color: '#ffffff',
    pointerEvents: 'none' as const,
    zIndex: 10,
  },
  header: {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(0,0,0,0.6)',
    pointerEvents: 'auto' as const,
  },
  floorInfo: {
    fontSize: '0.95rem',
    color: '#ccccff',
  },
  section: {
    position: 'absolute' as const,
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'auto' as const,
    textAlign: 'center' as const,
  },
  sectionLabel: {
    fontSize: '0.85rem',
    color: '#aaaacc',
    marginBottom: '0.5rem',
  },
  nodeList: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  nodeButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: 'rgba(60,60,140,0.85)',
    color: '#ffffff',
    border: '1px solid #6666cc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  hint: {
    position: 'absolute' as const,
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#888888',
    fontSize: '0.85rem',
    pointerEvents: 'none' as const,
  },
  error: {
    position: 'absolute' as const,
    bottom: '5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#ff6666',
    fontSize: '0.85rem',
    pointerEvents: 'none' as const,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
} as const
