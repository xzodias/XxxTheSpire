import { type Effect } from './Effect'
import { type Player } from '../../domain/entities/Player'
import { type IRandomService } from '../../domain/interfaces/IRandomService'
import { type DrawResult, drawCards } from '../../domain/rules/DeckRules'

/**
 * ドローエフェクト（アプリケーション層）
 *
 * カードをプレイしたときに山札から count 枚ドローする。
 * DeckRules.drawCards() を呼び出してイミュータブルに状態を更新する。
 *
 * - count は非負整数でなければならない（負数・小数はコンストラクタで弾く）
 * - 参照可能な層: domain, application/effects のみ
 * - 参照してはいけない層: infrastructure, presentation
 */
export class DrawCardEffect implements Effect {
  constructor(private readonly count: number) {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`DrawCardEffect: count must be a non-negative integer, got ${count}`)
    }
  }

  apply(player: Player, random: IRandomService): DrawResult {
    return drawCards(player, this.count, random)
  }
}
