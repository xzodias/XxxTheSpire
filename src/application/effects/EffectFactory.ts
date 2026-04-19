import { type EffectDef, type Result, ok, err } from '../../shared/types'
import { type Effect } from './Effect'
import { DamageEffect } from './DamageEffect'
import { BlockEffect } from './BlockEffect'
import { DrawEffect } from './DrawEffect'
import { AllEnemiesDamageEffect } from './AllEnemiesDamageEffect'
import { ApplyStatusEffectEffect } from './ApplyStatusEffectEffect'
import { StatusEffectType } from '../../domain/entities/StatusEffect'

type EffectBuilder = (def: EffectDef) => Effect

const VALID_STATUS_EFFECT_TYPES: ReadonlySet<string> = new Set(Object.values(StatusEffectType))

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
  all_enemies_damage: (def) => new AllEnemiesDamageEffect(def.value),
  apply_status_effect: (def) => {
    const seType = def.statusEffectType
    if (!seType || !VALID_STATUS_EFFECT_TYPES.has(seType)) {
      throw new Error(`apply_status_effect: unknown statusEffectType "${seType}"`)
    }
    if (def.target !== 'player' && def.target !== 'enemy') {
      throw new Error(
        `apply_status_effect: target must be 'player' or 'enemy', got "${def.target}"`,
      )
    }
    return new ApplyStatusEffectEffect(seType as StatusEffectType, def.value, def.target)
  },
}

/**
 * エフェクトファクトリ（アプリケーション層）
 *
 * カード JSON の effects 配列（EffectDef[]）を実行可能な Effect[] に変換する。
 *
 * - 成功時: ok(Effect[]) を返す
 * - 未知タイプ・不正値があった場合: err(errors) を返す（エラー内容を文字列配列で通知）
 * - コンストラクタの例外は全て err に変換する（不正な EffectDef データを安全に処理するため）
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
        errors.push(
          `Failed to build effect "${def.type}": ${e instanceof Error ? e.message : String(e)}`,
        )
      }
    }

    return errors.length > 0 ? err(errors) : ok(effects)
  }
}
