import Phaser from 'phaser'

import {
  EventBus,
  type MapNodeRenderData,
  type MapUpdatePayload,
  type Unsubscribe,
} from '../EventBus'
import { NodeType } from '../../../shared/types'
import type { NodeId } from '../../../shared/types'
import { SceneKey } from '../../../shared/constants'

/**
 * MapScene — マップ描画シーン
 *
 * EventBus 経由で React（useMapViewModel）から受け取ったマップデータを Canvas に描画する。
 * ゲームロジックは持たない（純粋な描画担当）。
 *
 * 参照可能な層: presentation のみ（domain/application/infrastructure は直接 import 禁止）
 */

// ---- レイアウト定数 ----
const MAP_ORIGIN_X = 240
const MAP_ORIGIN_Y = 60
const MAP_HEIGHT_PX = 580
const MAX_COLUMNS = 7
// 横方向のノード間隔: 利用可能幅 800px を MAX_COLUMNS+1 等分
const COL_SPACING = 800 / (MAX_COLUMNS + 1)

const NODE_RADIUS = 18
const NODE_LABEL_OFFSET_Y = NODE_RADIUS + 8

// ---- ノード種別ごとの表示色 ----
// NodeType は shared/types で定義されているため、型安全に Record のキーとして使用できる。
const NODE_FILL_COLOR: Record<NodeType, number> = {
  [NodeType.Combat]: 0x888888,
  [NodeType.Elite]: 0xaa44cc,
  [NodeType.Event]: 0x4488cc,
  [NodeType.Shop]: 0xddaa00,
  [NodeType.Rest]: 0x44aa66,
  [NodeType.Boss]: 0xcc3333,
}

// ---- ノード種別ごとの略称ラベル ----
const NODE_TYPE_LABEL: Record<NodeType, string> = {
  [NodeType.Combat]: 'CMB',
  [NodeType.Elite]: 'ELT',
  [NodeType.Event]: 'EVT',
  [NodeType.Shop]: 'SHP',
  [NodeType.Rest]: 'RST',
  [NodeType.Boss]: 'BSS',
}

// ---- ビジュアル定数 ----
const ALPHA_ACTIVE = 1.0
const ALPHA_INACTIVE = 0.35
const PATH_COLOR = 0x666666
const PATH_ALPHA_VISITED = 0.8
const PATH_ALPHA_UNVISITED = 0.3
const CURRENT_RING_COLOR = 0xffffff
const SELECTED_RING_COLOR = 0xffff00
const SELECTABLE_RING_COLOR = 0x88ff88
const RING_STROKE_WIDTH = 3
const RING_RADIUS_OUTER = NODE_RADIUS + 6
const RING_RADIUS_SELECTABLE = NODE_RADIUS + 3

export class MapScene extends Phaser.Scene {
  private pathGraphics: Phaser.GameObjects.Graphics | null = null
  private nodeGraphics: Phaser.GameObjects.Graphics | null = null
  /** Text labels for node types; cleared and recreated on each render. */
  private labelGroup: Phaser.GameObjects.Group | null = null

  private currentPayload: MapUpdatePayload | null = null
  private selectedNodeId: NodeId | null = null

  private unsubMapUpdate: Unsubscribe | null = null
  private unsubNodeSelected: Unsubscribe | null = null

  constructor() {
    super({ key: SceneKey.Map })
  }

  create(): void {
    // Draw order: paths (bottom) → nodes → labels (top)
    this.pathGraphics = this.add.graphics()
    this.nodeGraphics = this.add.graphics()
    this.labelGroup = this.add.group()

    this.unsubMapUpdate = EventBus.on('mapUpdate', (payload) => {
      // Guard: discard stale events delivered after the scene was stopped or destroyed.
      if (!this.scene.isActive(SceneKey.Map)) return
      this.currentPayload = payload
      // Reset selection when new map data arrives; the previous NodeId may not exist in the
      // new payload (e.g. floor transition) and would cause a stale highlight.
      this.selectedNodeId = null
      this.renderMap()
    })

    this.unsubNodeSelected = EventBus.on('nodeSelected', (payload) => {
      if (!this.scene.isActive(SceneKey.Map)) return
      this.selectedNodeId = payload.nodeId
      this.renderMap()
    })
  }

  /**
   * Called by Phaser when the scene is stopped (scene.stop / scene.sleep).
   * Removes EventBus subscriptions so stale handlers do not fire.
   * Note: Phaser.Scene does not declare this method in its TypeScript types;
   * it is invoked via Phaser's internal event system on the 'shutdown' event.
   */
  shutdown(): void {
    this.cleanupSubscriptions()
    this.cleanupGraphics()
  }

  /**
   * Called by Phaser when the scene is removed from the SceneManager.
   * Mirrors shutdown() to ensure cleanup when the scene is destroyed rather than stopped.
   * Note: Phaser.Scene does not declare destroy() in its TypeScript types;
   * it is invoked via Phaser's internal event system on the 'destroy' event.
   */
  destroy(): void {
    this.cleanupSubscriptions()
    this.cleanupGraphics()
  }

  // ---------------------------------------------------------------------------
  // Private rendering helpers
  // ---------------------------------------------------------------------------

  private renderMap(): void {
    if (this.currentPayload === null) return

    this.pathGraphics?.clear()
    this.nodeGraphics?.clear()
    // Destroy existing label Text objects before recreating them.
    this.labelGroup?.clear(true, true)

    const { nodes, currentNodeId, selectableNodeIds } = this.currentPayload
    const nodeMap = new Map<NodeId, MapNodeRenderData>(nodes.map((n) => [n.id, n]))
    const selectableSet = new Set<NodeId>(selectableNodeIds)
    const maxFloor = nodes.reduce((max, n) => Math.max(max, n.floor), 0)

    // Connections in MapNodeRenderData are directed (parent → child), matching
    // the MapGenerator output. Drawing each node's outgoing edges once is sufficient;
    // iterating all nodes produces no duplicate lines under this invariant.
    this.drawPaths(nodes, nodeMap, maxFloor)
    this.drawNodes(nodes, currentNodeId, selectableSet, maxFloor)
  }

  private drawPaths(
    nodes: readonly MapNodeRenderData[],
    nodeMap: Map<NodeId, MapNodeRenderData>,
    maxFloor: number,
  ): void {
    for (const node of nodes) {
      const from = this.nodePosition(node.column, node.floor, maxFloor)
      for (const connId of node.connections) {
        const connNode = nodeMap.get(connId)
        if (connNode === undefined) continue
        const to = this.nodePosition(connNode.column, connNode.floor, maxFloor)
        const alpha = node.visited ? PATH_ALPHA_VISITED : PATH_ALPHA_UNVISITED
        this.pathGraphics?.lineStyle(2, PATH_COLOR, alpha)
        this.pathGraphics?.beginPath()
        this.pathGraphics?.moveTo(from.x, from.y)
        this.pathGraphics?.lineTo(to.x, to.y)
        this.pathGraphics?.strokePath()
      }
    }
  }

  private drawNodes(
    nodes: readonly MapNodeRenderData[],
    currentNodeId: NodeId | null,
    selectableSet: Set<NodeId>,
    maxFloor: number,
  ): void {
    for (const node of nodes) {
      const pos = this.nodePosition(node.column, node.floor, maxFloor)
      const isCurrent = node.id === currentNodeId
      const isSelected = node.id === this.selectedNodeId
      const isSelectable = selectableSet.has(node.id)
      const isActive = node.visited || isCurrent || isSelectable
      const fillAlpha = isActive ? ALPHA_ACTIVE : ALPHA_INACTIVE
      const fillColor = NODE_FILL_COLOR[node.type]

      // Outer ring for current / selected node
      if (isCurrent || isSelected) {
        const ringColor = isCurrent ? CURRENT_RING_COLOR : SELECTED_RING_COLOR
        this.nodeGraphics?.lineStyle(RING_STROKE_WIDTH, ringColor, 1)
        this.nodeGraphics?.strokeCircle(pos.x, pos.y, RING_RADIUS_OUTER)
      }

      // Subtle ring for selectable (reachable next) nodes
      if (isSelectable && !isCurrent) {
        this.nodeGraphics?.lineStyle(2, SELECTABLE_RING_COLOR, 0.7)
        this.nodeGraphics?.strokeCircle(pos.x, pos.y, RING_RADIUS_SELECTABLE)
      }

      // Node body
      this.nodeGraphics?.fillStyle(fillColor, fillAlpha)
      this.nodeGraphics?.fillCircle(pos.x, pos.y, NODE_RADIUS)

      // Node type label (Text object lifetime managed by labelGroup)
      const labelText = NODE_TYPE_LABEL[node.type]
      const label = this.add
        .text(pos.x, pos.y + NODE_LABEL_OFFSET_Y, labelText, {
          fontSize: '10px',
          color: '#cccccc',
        })
        .setOrigin(0.5, 0)
        .setAlpha(fillAlpha)
      this.labelGroup?.add(label)
    }
  }

  /**
   * ノードのCanvas座標を計算する。
   * floor 0 が画面下、ボス（最大floor）が画面上になるよう配置する。
   */
  private nodePosition(
    column: number,
    floor: number,
    maxFloor: number,
  ): { readonly x: number; readonly y: number } {
    const x = MAP_ORIGIN_X + COL_SPACING * (column + 1)
    const floorRatio = maxFloor > 0 ? floor / maxFloor : 0
    const y = MAP_ORIGIN_Y + MAP_HEIGHT_PX * (1 - floorRatio)
    return { x, y }
  }

  private cleanupSubscriptions(): void {
    this.unsubMapUpdate?.()
    this.unsubNodeSelected?.()
    this.unsubMapUpdate = null
    this.unsubNodeSelected = null
  }

  private cleanupGraphics(): void {
    this.pathGraphics?.destroy()
    this.nodeGraphics?.destroy()
    this.labelGroup?.clear(true, true)
    this.labelGroup?.destroy()
    this.pathGraphics = null
    this.nodeGraphics = null
    this.labelGroup = null
  }
}
