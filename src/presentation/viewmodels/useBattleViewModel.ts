import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { castDraft } from 'immer'
import { type Player } from '../../domain/entities/Player'
import { type Enemy } from '../../domain/entities/Enemy'
import { type Card } from '../../domain/entities/Card'
import { type IRandomService } from '../../domain/interfaces/IRandomService'
import { type Target } from '../../shared/types'
import { EffectFactory } from '../../application/effects/EffectFactory'
import { executeEffects } from '../../application/effects/EffectExecutor'
import { type BattleState } from '../../domain/entities/BattleState'

/**
 * 戦闘データの discriminated union
 *
 * - idle:   戦闘未開始
 * - active: 戦闘進行中。player・enemies・randomService が確定している
 * - error:  エフェクト構築失敗（不正なカードデータ等）。reason にエラー詳細が入る
 */
export type BattleData =
  | { readonly status: 'idle' }
  | {
      readonly status: 'active'
      readonly player: Player
      readonly enemies: readonly Enemy[]
      readonly randomService: IRandomService
    }
  | { readonly status: 'error'; readonly reason: readonly string[] }

/**
 * 戦闘ViewModel — 戦闘状態を管理する Zustand ストア
 *
 * 責務:
 * - 戦闘の初期化（initBattle）
 * - カードプレイ（playCard）による状態更新
 * - battleData を UI に公開
 *
 * アーキテクチャ:
 * - Immer ミドルウェアで draft 変更（presentation 層のみ許容）
 * - EffectFactory + EffectExecutor を通じてエフェクト実行
 * - RandomService は initBattle 時に外部から注入（テスト可能性を確保）
 * - RandomService は BattleData の active 状態に含め、モジュールレベルの変数を排除
 *
 * 参照可能な層: domain, application, infrastructure（RandomService）
 */
interface BattleViewModelState {
  readonly battleData: BattleData
  readonly initBattle: (
    player: Player,
    enemies: readonly Enemy[],
    randomService: IRandomService,
  ) => void
  readonly playCard: (card: Card, target: Target | undefined) => void
}

export const useBattleViewModel = create<BattleViewModelState>()(
  immer((set, get) => ({
    battleData: { status: 'idle' },

    initBattle: (player, enemies, randomService) => {
      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player,
          enemies,
          randomService,
        })
      })
    },

    playCard: (card, target) => {
      const { battleData } = get()
      if (battleData.status !== 'active') return

      const effectsResult = EffectFactory.build(card.effects)
      if (!effectsResult.ok) {
        set((draft) => {
          draft.battleData = castDraft({
            status: 'error' as const,
            reason: effectsResult.error,
          })
        })
        return
      }

      const currentState: BattleState = {
        player: battleData.player,
        enemies: battleData.enemies,
      }
      const context = { target }
      const services = { random: battleData.randomService }

      const nextState = executeEffects(effectsResult.value, currentState, context, services)

      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player: nextState.player,
          enemies: nextState.enemies,
          randomService: battleData.randomService,
        })
      })
    },
  })),
)
