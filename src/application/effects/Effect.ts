import { type Player } from '../../domain/entities/Player'
import { type IRandomService } from '../../domain/interfaces/IRandomService'

/**
 * エフェクト適用結果の基底型。
 * 全エフェクトが最低限返す情報。プレイヤー状態を更新する。
 *
 * 敵を対象とするエフェクト（DamageEffect 等）は将来 EffectContext に
 * enemies を含める形に拡張する（#135 エフェクトエンジン設計時に対応）。
 */
export interface EffectApplyResult {
  readonly player: Player
}

/**
 * カードエフェクトのインターフェース（アプリケーション層）
 *
 * カード JSON の effects 配列から生成される実行可能なエフェクト単位。
 * EffectFactory が EffectDef → Effect[] に変換し、各エフェクトが apply() を通じて
 * プレイヤー/敵の状態を更新する。
 *
 * - apply() は純粋関数として実装する（副作用なし・イミュータブル）
 * - 戻り値は EffectApplyResult またはそのサブタイプ
 * - 参照可能な層: domain, application/effects
 * - 参照してはいけない層: infrastructure, presentation
 */
export interface Effect {
  apply(player: Player, random: IRandomService): EffectApplyResult
}
