import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { castDraft } from 'immer'
import type { Player } from '../../domain/entities/Player'
import type { MapNode } from '../../domain/entities/MapNode'
import { Seed } from '../../domain/value-objects/Seed'
import { type CharacterId, ScreenType } from '../../shared/types'
import { createContainer } from '../../di/container'

/**
 * ランデータの discriminated union
 *
 * - idle: ラン未開始。player・map・currentScreen にはアクセス不可（型レベルで保証）
 * - active: ラン進行中。player・map・currentScreen が確定している
 */
export type RunData =
  | { readonly status: 'idle' }
  | {
      readonly status: 'active'
      readonly player: Player
      readonly map: ReadonlyArray<ReadonlyArray<MapNode>>
      readonly currentScreen: ScreenType
    }

/**
 * ランViewModel — ゲーム全体の状態を管理するZustandストア
 *
 * 責務:
 * - ランの開始前後の状態（runData: RunData）
 * - ラン開始（startRun）・画面遷移（navigateTo）アクション
 * - startRun失敗時のエラー状態（startRunError）
 *
 * 参照してはいけない層: infrastructure（DIコンテナ経由でのみアクセス）
 * クロスストア依存: useMapViewModel を直接 import しない。
 *   マップ初期化は useRunMapSync フック（App.tsx）が subscribe 経由で行う。
 */
interface RunState {
  readonly runData: RunData
  /**
   * startRun失敗時のエラーメッセージ。成功時・未実行時は null。
   *
   * 設計意図: runData（RunData discriminated union）はランのライフサイクル状態を表す。
   * startRunError はランの開始操作の結果を表す UI フィードバック用フィールドであり、
   * RunData の一部には含めない（ラン状態とエラー表示の関心が異なるため）。
   */
  readonly startRunError: string | null
  /** startRun実行中フラグ（二重起動防止） */
  readonly isStarting: boolean
  readonly startRun: (characterId: string) => void
  readonly navigateTo: (screen: ScreenType) => void
  readonly clearError: () => void
}

export const useRunViewModel = create<RunState>()(
  immer((set) => ({
    runData: { status: 'idle' },
    startRunError: null,
    isStarting: false,

    startRun: (characterId: string) => {
      if (useRunViewModel.getState().isStarting) return

      set((draft) => {
        draft.isStarting = true
        draft.startRunError = null
      })

      const seed = Seed.generate()
      const container = createContainer(seed)

      // NOTE: execute は同期処理を前提としている。
      // 非同期化する場合は isStarting ガードと set() の順序を再設計すること。
      try {
        const result = container.startRunUseCase.execute(characterId as CharacterId, seed)

        if (result.ok) {
          set((draft) => {
            draft.runData = castDraft({
              status: 'active' as const,
              player: result.value.player,
              map: result.value.map,
              currentScreen: ScreenType.Map,
            })
            draft.isStarting = false
          })
        } else {
          set((draft) => {
            draft.startRunError = result.error
            draft.isStarting = false
          })
        }
      } catch (e) {
        set((draft) => {
          draft.isStarting = false
        })
        throw e
      }
    },

    navigateTo: (screen: ScreenType) => {
      set((draft) => {
        if (draft.runData.status === 'active') {
          draft.runData = castDraft({
            ...draft.runData,
            currentScreen: screen,
          })
        }
      })
    },

    clearError: () => {
      set((draft) => {
        draft.startRunError = null
      })
    },
  })),
)
