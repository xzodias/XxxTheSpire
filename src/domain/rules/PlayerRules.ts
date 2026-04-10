import { type Player } from '../entities/Player'
import { type Block } from '../value-objects/Block'

/**
 * プレイヤーのブロック値を更新した新しい Player を返す（純粋関数）。
 *
 * BlockEffect が直接 spread しないよう domain ルールとして集約する。
 * 将来的にブロック付与時の Power 発動（Juggernaut 等）もここに追加できる。
 *
 * @param player - 現在のプレイヤー（イミュータブル）
 * @param block  - 新しいブロック値
 * @returns 更新後の新しい Player オブジェクト
 *
 * 参照可能な層: domain/entities のみ
 */
export function setPlayerBlock(player: Player, block: Block): Player {
  return { ...player, block }
}
