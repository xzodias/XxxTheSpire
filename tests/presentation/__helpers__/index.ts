import type { MapNode } from '../../../src/domain/entities/MapNode'
import type { Player } from '../../../src/domain/entities/Player'
import type { NodeId } from '../../../src/shared/types'
import { NodeType } from '../../../src/shared/types'
import { ScreenType } from '../../../src/shared/types/ScreenType'
import { useRunViewModel } from '../../../src/presentation/viewmodels/useRunViewModel'
import { useMapViewModel } from '../../../src/presentation/viewmodels/useMapViewModel'

export function makeMapNode(id: string, floor: number): MapNode {
  return { id: id as NodeId, type: NodeType.Combat, floor, connections: [], visited: false }
}

export const MOCK_MAP: ReadonlyArray<ReadonlyArray<MapNode>> = [
  [makeMapNode('node-0', 0)],
  [makeMapNode('node-1', 1)],
]

export const MOCK_PLAYER = {
  id: 'ironclad',
  name: 'Ironclad',
  health: { current: 80, max: 80 },
  energy: { current: 3, max: 3 },
  gold: { amount: 99 },
  block: { value: 0 },
  deck: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],
  relics: [],
  powers: [],
  statusEffects: [],
  potions: [null, null, null],
  maxPotionSlots: 3,
} as unknown as Player

export function setActiveRunState(): void {
  useRunViewModel.setState({
    runData: {
      status: 'active',
      player: MOCK_PLAYER,
      map: MOCK_MAP,
      currentScreen: ScreenType.Map,
    },
    isStarting: false,
    startRunError: null,
  })
}

export function setIdleRunState(): void {
  useRunViewModel.setState({
    runData: { status: 'idle' },
    isStarting: false,
    startRunError: null,
  })
}

export function resetMapViewModel(): void {
  useMapViewModel.setState({
    map: null,
    currentNodeId: null,
    selectableNodeIds: [],
    selectNodeError: null,
  })
}
