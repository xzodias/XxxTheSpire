// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  createRunMapSubscription,
  useRunMapSync,
} from '../../../src/presentation/hooks/useRunMapSync'
import { useRunViewModel } from '../../../src/presentation/viewmodels/useRunViewModel'
import { useMapViewModel } from '../../../src/presentation/viewmodels/useMapViewModel'
import type { MapNode } from '../../../src/domain/entities/MapNode'
import { ScreenType } from '../../../src/shared/types/ScreenType'
import {
  makeMapNode,
  MOCK_MAP,
  MOCK_PLAYER,
  setActiveRunState,
  setIdleRunState,
  resetMapViewModel,
} from '../__helpers__'

// --- Mocks ---

vi.mock('../../../src/di/container', () => ({
  createContainer: vi.fn(),
}))

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  setIdleRunState()
  resetMapViewModel()
})

// ============================================================
// createRunMapSubscription — 購読設定のみ（初期同期なし）
// ============================================================

describe('createRunMapSubscription', () => {
  describe('購読設定（初期同期は行わない）', () => {
    it('1. マウント時に active でも useMapViewModel は初期化しない（初期同期は呼び出し側の責務）', () => {
      setActiveRunState()
      const unsubscribe = createRunMapSubscription()

      // createRunMapSubscription 自体は初期同期をしない
      expect(useMapViewModel.getState().map).toBeNull()

      unsubscribe()
    })

    it('2. マウント時に idle でも useMapViewModel は変化しない', () => {
      const unsubscribe = createRunMapSubscription()
      expect(useMapViewModel.getState().map).toBeNull()
      unsubscribe()
    })
  })

  describe('idle → active 遷移の通知', () => {
    it('3. idle → active 遷移時に useMapViewModel が初期化されること', () => {
      const unsubscribe = createRunMapSubscription()
      expect(useMapViewModel.getState().map).toBeNull()

      setActiveRunState()

      expect(useMapViewModel.getState().map).not.toBeNull()
      expect(useMapViewModel.getState().map).toHaveLength(MOCK_MAP.length)

      unsubscribe()
    })

    it('4. active → active 遷移では useMapViewModel は再初期化されないこと', () => {
      setActiveRunState()
      const unsubscribe = createRunMapSubscription()
      const mapBefore = useMapViewModel.getState().map

      // active → active（status は変わらない）
      const newMap: ReadonlyArray<ReadonlyArray<MapNode>> = [[makeMapNode('new-node-0', 0)]]
      useRunViewModel.setState({
        runData: {
          status: 'active',
          player: MOCK_PLAYER,
          map: newMap,
          currentScreen: ScreenType.Map,
        },
      })

      expect(useMapViewModel.getState().map).toBe(mapBefore)
      unsubscribe()
    })

    it('5. active → idle 遷移時に useMapViewModel がリセットされること', () => {
      setActiveRunState()
      const unsubscribe = createRunMapSubscription()
      useMapViewModel.getState().initialize(MOCK_MAP) // 事前に初期化しておく

      setIdleRunState()
      unsubscribe() // assertion 前にクリーンアップ（失敗時のリーク防止）

      expect(useMapViewModel.getState().map).toBeNull()
      expect(useMapViewModel.getState().currentNodeId).toBeNull()
      expect(useMapViewModel.getState().selectableNodeIds).toHaveLength(0)
    })
  })

  describe('クリーンアップ', () => {
    it('6. unsubscribe 後は idle → active 遷移しても useMapViewModel が更新されないこと', () => {
      const unsubscribe = createRunMapSubscription()
      unsubscribe()

      setActiveRunState()

      expect(useMapViewModel.getState().map).toBeNull()
    })

    it('7. createRunMapSubscription が unsubscribe 関数を返すこと', () => {
      const unsubscribe = createRunMapSubscription()
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })

  describe('複数購読の独立性', () => {
    it('S-2. 複数の createRunMapSubscription を同時に設定したとき、それぞれの unsubscribe が独立して動作すること', () => {
      const unsubscribe1 = createRunMapSubscription()
      const unsubscribe2 = createRunMapSubscription()

      // unsubscribe1 のみ解除
      unsubscribe1()

      // idle → active 遷移: unsubscribe2 はまだ有効なので初期化される
      setActiveRunState()
      expect(useMapViewModel.getState().map).not.toBeNull()

      // map をリセットして unsubscribe2 も解除
      useMapViewModel.setState({
        map: null,
        currentNodeId: null,
        selectableNodeIds: [],
        selectNodeError: null,
      })
      unsubscribe2()

      setIdleRunState()
      setActiveRunState()

      // 両方解除済みなので map は null のまま
      expect(useMapViewModel.getState().map).toBeNull()
    })
  })
})

// ============================================================
// useRunMapSync — React フックのライフサイクル（#9）
// ============================================================

describe('useRunMapSync', () => {
  describe('マウント時の初期同期', () => {
    it('H-1. マウント時に runData が active なら useMapViewModel が即座に初期化されること', () => {
      setActiveRunState()

      renderHook(() => useRunMapSync())

      expect(useMapViewModel.getState().map).not.toBeNull()
      expect(useMapViewModel.getState().map).toHaveLength(MOCK_MAP.length)
    })

    it('H-2. マウント時に runData が idle なら useMapViewModel は初期化されないこと', () => {
      // runData は idle（beforeEach でリセット済み）
      renderHook(() => useRunMapSync())

      expect(useMapViewModel.getState().map).toBeNull()
    })
  })

  describe('マウント後の動的遷移', () => {
    it('H-5. マウント後に idle → active 遷移したとき useMapViewModel が更新されること', () => {
      renderHook(() => useRunMapSync())
      expect(useMapViewModel.getState().map).toBeNull()

      act(() => {
        setActiveRunState()
      })

      expect(useMapViewModel.getState().map).not.toBeNull()
    })

    it('H-6. マウント後に active → idle 遷移したとき useMapViewModel がリセットされること', () => {
      setActiveRunState()
      const { unmount } = renderHook(() => useRunMapSync())
      expect(useMapViewModel.getState().map).not.toBeNull()

      act(() => {
        setIdleRunState()
      })
      unmount() // assertion 前にクリーンアップ（失敗時のリーク防止）

      expect(useMapViewModel.getState().map).toBeNull()
      expect(useMapViewModel.getState().currentNodeId).toBeNull()
      expect(useMapViewModel.getState().selectableNodeIds).toHaveLength(0)
    })
  })

  describe('unmount 時のクリーンアップ（AC2: メモリリーク防止）', () => {
    it('H-3. unmount 後は idle → active 遷移しても useMapViewModel が更新されないこと', () => {
      const { unmount } = renderHook(() => useRunMapSync())

      unmount()

      act(() => {
        setActiveRunState()
      })

      // 購読が解除されているため map は null のまま
      expect(useMapViewModel.getState().map).toBeNull()
    })

    it('H-4. unmount 後に再マウントしたとき購読が正常に再設定されること', () => {
      const { unmount } = renderHook(() => useRunMapSync())
      unmount()

      // 再マウント
      renderHook(() => useRunMapSync())

      act(() => {
        setActiveRunState()
      })

      expect(useMapViewModel.getState().map).not.toBeNull()
    })
  })
})
