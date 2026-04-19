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
import { tickStatusEffects } from '../../domain/rules/StatusEffectRules'
import { notifyPlayerPowers, notifyEnemyPowers } from '../../domain/entities/Power'

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
  /** プレイヤーターン開始処理: プレイヤーの Block をリセット、Poison ダメージを適用 */
  readonly startPlayerTurn: () => void
  /** プレイヤーターン終了処理: プレイヤーの持続型 StatusEffect を1ターン減算 */
  readonly endPlayerTurn: () => void
  /** 敵ターン開始処理: 全敵の Block をリセット、敵の Poison ダメージを適用 */
  readonly startEnemyTurn: () => void
  /** 敵ターン終了処理: 全敵の持続型 StatusEffect を1ターン減算 */
  readonly endEnemyTurn: () => void
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

    startPlayerTurn: () => {
      const { battleData } = get()
      if (battleData.status !== 'active') return

      const stateWithResetBlock = {
        player: { ...battleData.player, block: battleData.player.block.reset() } as Player,
        enemies: battleData.enemies,
      }
      const nextState = notifyPlayerPowers({ type: 'on_turn_start' }, stateWithResetBlock)

      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player: nextState.player,
          enemies: nextState.enemies,
          randomService: battleData.randomService,
        })
      })
    },

    endPlayerTurn: () => {
      const { battleData } = get()
      if (battleData.status !== 'active') return

      const tickedPlayer = tickStatusEffects(battleData.player)

      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player: tickedPlayer,
          enemies: battleData.enemies,
          randomService: battleData.randomService,
        })
      })
    },

    startEnemyTurn: () => {
      const { battleData } = get()
      if (battleData.status !== 'active') return

      const stateWithResetBlock = {
        player: battleData.player,
        enemies: battleData.enemies.map(
          (enemy): Enemy => ({ ...enemy, block: enemy.block.reset() }),
        ),
      }
      const nextState = notifyEnemyPowers({ type: 'on_turn_start' }, stateWithResetBlock)

      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player: nextState.player,
          enemies: nextState.enemies,
          randomService: battleData.randomService,
        })
      })
    },

    endEnemyTurn: () => {
      const { battleData } = get()
      if (battleData.status !== 'active') return

      const tickedEnemies: readonly Enemy[] = battleData.enemies.map(tickStatusEffects)

      set((draft) => {
        draft.battleData = castDraft({
          status: 'active' as const,
          player: battleData.player,
          enemies: tickedEnemies,
          randomService: battleData.randomService,
        })
      })
    },
  })),
)
