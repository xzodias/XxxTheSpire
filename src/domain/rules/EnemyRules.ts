import { type Enemy } from '../entities/Enemy'
import { type Result, ok, err } from '../../shared/types'

/**
 * 指定 id の敵のみを更新した新しい enemies 配列を返す（純粋関数）。
 *
 * 対象が存在しない場合は ok: false を返す（サイレント no-op を防ぐ）。
 * updater が返す Enemy のスプレッド再構築はこの関数に集約し、
 * 各エフェクトが直接 map を書くことを避ける。
 *
 * @param enemies  - 現在の敵一覧（イミュータブル）
 * @param targetId - 更新対象の敵インスタンス id（Character.id）
 * @param updater  - 対象敵を受け取り更新後の敵を返す純粋関数
 * @returns ok: 更新後の配列、err: 'enemy_not_found'（対象敵が存在しない場合）
 *
 * 参照可能な層: domain/entities のみ
 */
export function updateEnemy(
  enemies: readonly Enemy[],
  targetId: string,
  updater: (enemy: Enemy) => Enemy,
): Result<readonly Enemy[], 'enemy_not_found'> {
  const found = enemies.some((e) => e.id === targetId)
  if (!found) return err('enemy_not_found')
  return ok(enemies.map((e) => (e.id === targetId ? updater(e) : e)))
}
