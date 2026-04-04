import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { castDraft } from 'immer'
import type { Player } from '../../domain/entities/Player'
import type { MapNode } from '../../domain/entities/MapNode'
import { Seed } from '../../domain/value-objects/Seed'
import { ScreenType } from '../../shared/types/ScreenType'
import { createContainer } from '../../di/container'

/**
 * ランViewModel — ゲーム全体の状態を管理するZustandストア
 *
 * 責務:
 * - 現在表示中の画面（currentScreen）
 * - プレイヤー状態（player）・マップ状態（map）
 * - ラン開始（startRun）・画面遷移（navigateTo）アクション
 * - startRun失敗時のエラー状態（startRunError）
 *
 * 参照してはいけない層: infrastructure（DIコンテナ経由でのみアクセス）
 */
interface RunState {
  readonly currentScreen: ScreenType
  readonly player: Player | null
  readonly map: MapNode[][] | null
  /** startRun失敗時のエラーメッセージ。成功時・未実行時は null */
  readonly startRunError: string | null
  /** startRun実行中フラグ（二重起動防止） */
  readonly isStarting: boolean
  startRun: (characterId: string) => void
  navigateTo: (screen: ScreenType) => void
}

export const useRunViewModel = create<RunState>()(
  immer((set) => ({
    currentScreen: ScreenType.Map,
    player: null,
    map: null,
    startRunError: null,
    isStarting: false,

    startRun: (characterId: string) => {
      set((draft) => {
        if (draft.isStarting) return
        draft.isStarting = true
        draft.startRunError = null
      })

      const seed = Seed.generate()
      const container = createContainer(seed)
      const result = container.startRunUseCase.execute(characterId, seed)

      if (result.ok) {
        set((draft) => {
          draft.player = castDraft(result.value.player)
          draft.map = castDraft(result.value.map)
          draft.currentScreen = ScreenType.Map
          draft.isStarting = false
        })
      } else {
        set((draft) => {
          draft.startRunError = result.error
          draft.isStarting = false
        })
      }
    },

    navigateTo: (screen: ScreenType) => {
      set((draft) => {
        draft.currentScreen = screen
      })
    },
  })),
)
