import { type EffectDef, type Result, ok, err } from '../../shared/types'
import { type Effect } from './Effect'
import { DamageEffect } from './DamageEffect'
import { BlockEffect } from './BlockEffect'
import { DrawEffect } from './DrawEffect'

type EffectBuilder = (def: EffectDef) => Effect

/**
 * エフェクトビルダーレジストリ
 *
 * EffectDef.type → Effect インスタンス生成関数のマッピング。
 * 新しいエフェクトタイプを追加する際はここにエントリを追加するだけでよい。
 */
const EFFECT_BUILDERS: Record<string, EffectBuilder> = {
  damage: (def) => new DamageEffect(def.value),
  block: (def) => new BlockEffect(def.value),
  draw: (def) => new DrawEffect(def.value),
}

/**
 * エフェクトファクトリ（アプリケーション層）
 *
 * カード JSON の effects 配列（EffectDef[]）を実行可能な Effect[] に変換する。
 *
 * - 成功時: ok(Effect[]) を返す
 * - 未知タイプ・不正値があった場合: err(errors) を返す（エラー内容を文字列配列で通知）
 * - Error 以外の予期しない例外は再スローしてプログラマーバグを隠さない
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class EffectFactory {
  static build(defs: readonly EffectDef[]): Result<Effect[], string[]> {
    const effects: Effect[] = []
    const errors: string[] = []

    for (const def of defs) {
      const builder = EFFECT_BUILDERS[def.type]
      if (!builder) {
        errors.push(`Unknown effect type: "${def.type}"`)
        continue
      }
      try {
        effects.push(builder(def))
      } catch (e) {
        if (!(e instanceof Error)) throw e
        errors.push(`Failed to build effect "${def.type}": ${e.message}`)
      }
    }

    return errors.length > 0 ? err(errors) : ok(effects)
  }
}
