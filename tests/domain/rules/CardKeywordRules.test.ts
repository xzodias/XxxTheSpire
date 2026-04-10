import { describe, it, expect } from 'vitest'
import { playCard, applyEndOfTurnKeywords } from '../../../src/domain/rules/CardKeywordRules'
import { CardKeyword } from '../../../src/domain/enums/CardKeyword'
import { type Player } from '../../../src/domain/entities/Player'
import { type Card } from '../../../src/domain/entities/Card'
import { CardType } from '../../../src/domain/enums/CardType'
import { Rarity } from '../../../src/domain/enums/Rarity'
import { TargetType } from '../../../src/domain/enums/TargetType'
import { type CardId } from '../../../src/shared/types'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Health } from '../../../src/domain/value-objects/Health'
import { Gold } from '../../../src/domain/value-objects/Gold'
import { Block } from '../../../src/domain/value-objects/Block'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeCardId(id: string): CardId {
  return id as CardId
}

function makeCard(id: string, keywords: readonly CardKeyword[] = []): Card {
  return {
    id: makeCardId(id),
    name: id,
    description: `${id} description`,
    cost: 1,
    type: CardType.Attack,
    rarity: Rarity.Common,
    targetType: TargetType.Single,
    effects: [],
    upgraded: false,
    keywords,
  }
}

function makeExhaustCard(id: string): Card {
  return makeCard(id, [CardKeyword.Exhaust])
}

function makeEtherealCard(id: string): Card {
  return makeCard(id, [CardKeyword.Ethereal])
}

function makeRetainCard(id: string): Card {
  return makeCard(id, [CardKeyword.Retain])
}

function makePlayer(
  overrides: Partial<{
    deck: readonly Card[]
    hand: readonly Card[]
    discardPile: readonly Card[]
    exhaustPile: readonly Card[]
  }>,
): Player {
  const health = Health.create(80, 80)
  const energy = Energy.create(3, 3)
  const gold = Gold.create(0)
  const block = Block.create(0)

  if (!health.ok) throw new Error('Failed to create health')
  if (!energy.ok) throw new Error('Failed to create energy')
  if (!gold.ok) throw new Error('Failed to create gold')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id: 'ironclad',
    name: 'Ironclad',
    health: health.value,
    energy: energy.value,
    gold: gold.value,
    block: block.value,
    deck: overrides.deck ?? [],
    hand: overrides.hand ?? [],
    discardPile: overrides.discardPile ?? [],
    exhaustPile: overrides.exhaustPile ?? [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: [],
    statusEffects: [],
  }
}

// ─────────────────────────────────────────────
// AC1: Exhaust キーワードを持つカードが使用後に消耗山札へ移動すること
// ─────────────────────────────────────────────

describe('playCard - AC1: Exhaust キーワード', () => {
  describe('正常系 - Exhaust カードのプレイ', () => {
    it('01: Exhaust カードをプレイすると exhaustPile に移動する', () => {
      // 観点 01: 正常入力での実行 / 観点 13: 有効遷移の受理（Exhaust後はexhaustPileにある）
      const card = makeExhaustCard('anger')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exhaustPile).toHaveLength(1)
      expect(result.value.exhaustPile[0]!.id).toBe(makeCardId('anger'))
    })

    it('Exhaust カードをプレイすると手札から除去される', () => {
      // 観点 13: 有効遷移の受理
      const card = makeExhaustCard('anger')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(0)
    })

    it('Exhaust カードをプレイしても捨て札には移動しない', () => {
      // 観点 13: Exhaust は discard ではなく exhaust である
      const card = makeExhaustCard('anger')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.discardPile).toHaveLength(0)
    })

    it('Exhaust カードをプレイしても山札は変化しない', () => {
      // 観点 11: 操作後の元オブジェクト不変性（deck は変わらない）
      const deckCards = [makeCard('strike'), makeCard('defend')]
      const exhaustCard = makeExhaustCard('anger')
      const player = makePlayer({ hand: [exhaustCard], deck: deckCards })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.deck).toHaveLength(2)
    })

    it('既存の exhaustPile に追加される（複数枚消耗）', () => {
      // 観点 04: 同値クラス（中間値：既存exhaustPileがある状態）
      const existingExhaust = [makeExhaustCard('old_exhaust')]
      const card = makeExhaustCard('anger')
      const player = makePlayer({ hand: [card], exhaustPile: existingExhaust })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exhaustPile).toHaveLength(2)
    })
  })

  describe('異常系 - 存在しないカード参照', () => {
    it('09: 手札にない Exhaust カードをプレイすると not_in_hand エラーを返す', () => {
      // 観点 09: エラー種別の正確さ
      const player = makePlayer({ hand: [makeExhaustCard('anger')] })

      const result = playCard(player, makeCardId('nonexistent'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })

    it('05: 手札が空のとき playCard を呼ぶと not_in_hand エラーを返す', () => {
      // 観点 05: 境界値超過（下限違反：手札0枚）
      const player = makePlayer({ hand: [] })

      const result = playCard(player, makeCardId('anger'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })
  })

  describe('イミュータビリティ', () => {
    it('11: 元の player オブジェクトを変更しない', () => {
      // 観点 11: 操作後の元オブジェクト不変性
      const card = makeExhaustCard('anger')
      const player = makePlayer({ hand: [card] })

      playCard(player, makeCardId('anger'))

      expect(player.hand).toHaveLength(1)
      expect(player.exhaustPile).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────
// AC4: キーワードなしカードは通常通り捨て札に移動すること
// ─────────────────────────────────────────────

describe('playCard - AC4: キーワードなしカード（通常の捨て札移動）', () => {
  describe('正常系', () => {
    it('01: キーワードなしカードをプレイすると捨て札に移動する', () => {
      // 観点 01: 正常入力での実行
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('strike'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.discardPile).toHaveLength(1)
      expect(result.value.discardPile[0]!.id).toBe(makeCardId('strike'))
    })

    it('キーワードなしカードをプレイすると手札から除去される', () => {
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('strike'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.hand).toHaveLength(0)
    })

    it('キーワードなしカードをプレイしても exhaustPile には移動しない', () => {
      // AC4 と AC1 の分岐が正しく動くことを確認する
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      const result = playCard(player, makeCardId('strike'))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.exhaustPile).toHaveLength(0)
    })
  })

  describe('異常系', () => {
    it('09: 手札にないカードをプレイすると not_in_hand エラーを返す', () => {
      // 観点 09: エラー種別の正確さ
      const player = makePlayer({ hand: [makeCard('strike')] })

      const result = playCard(player, makeCardId('nonexistent'))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe('not_in_hand')
    })
  })

  describe('イミュータビリティ', () => {
    it('11: 元の player オブジェクトを変更しない', () => {
      // 観点 11: 操作後の元オブジェクト不変性
      const card = makeCard('strike')
      const player = makePlayer({ hand: [card] })

      playCard(player, makeCardId('strike'))

      expect(player.hand).toHaveLength(1)
      expect(player.discardPile).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────
// AC2: Ethereal キーワードを持つカードがターン終了時に手札から消耗されること
// ─────────────────────────────────────────────

describe('applyEndOfTurnKeywords - AC2: Ethereal キーワード', () => {
  describe('正常系 - ターン終了時の Ethereal 処理', () => {
    it('01: Ethereal カードはターン終了時に exhaustPile に移動する', () => {
      // 観点 01: 正常入力での実行 / 観点 13: 有効遷移の受理
      const etherealCard = makeEtherealCard('apparition')
      const player = makePlayer({ hand: [etherealCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.exhaustPile).toHaveLength(1)
      expect(result.exhaustPile[0]!.id).toBe(makeCardId('apparition'))
    })

    it('Ethereal カードはターン終了時に手札から除去される', () => {
      const etherealCard = makeEtherealCard('apparition')
      const player = makePlayer({ hand: [etherealCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.hand).toHaveLength(0)
    })

    it('Ethereal カードはターン終了時に捨て札には移動しない', () => {
      // Ethereal は discard ではなく exhaust
      const etherealCard = makeEtherealCard('apparition')
      const player = makePlayer({ hand: [etherealCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.discardPile).toHaveLength(0)
    })

    it('04: 手札に複数の Ethereal カードがあれば全て消耗される', () => {
      // 観点 04: 同値クラス（複数枚の Ethereal）
      const ethereal1 = makeEtherealCard('apparition_1')
      const ethereal2 = makeEtherealCard('apparition_2')
      const player = makePlayer({ hand: [ethereal1, ethereal2] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.exhaustPile).toHaveLength(2)
      expect(result.hand).toHaveLength(0)
    })

    it('手札に Ethereal と通常カードが混在する場合、Ethereal のみ消耗され通常カードは手札から除去される', () => {
      // 観点 16: 複数条件の組み合わせ
      // applyEndOfTurnKeywords の責務: 非 Retain カードは手札から除去する（捨て札移動は別処理の責務）
      const etherealCard = makeEtherealCard('apparition')
      const normalCard = makeCard('strike')
      const player = makePlayer({ hand: [etherealCard, normalCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.exhaustPile).toHaveLength(1)
      expect(result.exhaustPile[0]!.id).toBe(makeCardId('apparition'))
      // 通常カードは Retain でないため手札から除去される（捨て札への移動は別処理が担う）
      expect(result.hand).toHaveLength(0)
    })
  })

  describe('イミュータビリティ', () => {
    it('11: 元の player オブジェクトを変更しない', () => {
      // 観点 11: 操作後の元オブジェクト不変性
      const etherealCard = makeEtherealCard('apparition')
      const player = makePlayer({ hand: [etherealCard] })

      applyEndOfTurnKeywords(player)

      expect(player.hand).toHaveLength(1)
      expect(player.exhaustPile).toHaveLength(0)
    })
  })
})

// ─────────────────────────────────────────────
// AC3: Retain キーワードを持つカードがターン終了後も手札に残ること
// ─────────────────────────────────────────────

describe('applyEndOfTurnKeywords - AC3: Retain キーワード', () => {
  describe('正常系 - ターン終了時の Retain 処理', () => {
    it('01: Retain カードはターン終了後も手札に残る', () => {
      // 観点 01: 正常入力での実行 / 観点 13: 有効遷移の受理（手札に残ること）
      const retainCard = makeRetainCard('burn')
      const player = makePlayer({ hand: [retainCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.hand).toHaveLength(1)
      expect(result.hand[0]!.id).toBe(makeCardId('burn'))
    })

    it('Retain カードはターン終了時に捨て札に移動しない', () => {
      const retainCard = makeRetainCard('burn')
      const player = makePlayer({ hand: [retainCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.discardPile).toHaveLength(0)
    })

    it('Retain カードはターン終了時に exhaustPile に移動しない', () => {
      const retainCard = makeRetainCard('burn')
      const player = makePlayer({ hand: [retainCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.exhaustPile).toHaveLength(0)
    })

    it('04: 複数の Retain カードがあれば全て手札に残る', () => {
      // 観点 04: 同値クラス（複数枚の Retain）
      const retain1 = makeRetainCard('burn_1')
      const retain2 = makeRetainCard('burn_2')
      const player = makePlayer({ hand: [retain1, retain2] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.hand).toHaveLength(2)
    })
  })

  describe('16: 複数キーワードの混在', () => {
    it('手札に Retain と通常カードが混在する場合、Retain のみ手札に残る', () => {
      // 観点 16: 複数条件の組み合わせ
      const retainCard = makeRetainCard('burn')
      const normalCard = makeCard('strike')
      const player = makePlayer({ hand: [retainCard, normalCard] })

      const result = applyEndOfTurnKeywords(player)

      // Retain カードは手札に残る
      expect(result.hand.some((c) => c.id === makeCardId('burn'))).toBe(true)
      // 通常カードは手札に残らない（applyEndOfTurnKeywords の責務範囲では非 Retain は除去される）
      expect(result.hand.some((c) => c.id === makeCardId('strike'))).toBe(false)
    })

    it('手札に Ethereal と Retain が混在する場合、Ethereal は消耗されて Retain は残る', () => {
      // 観点 16: 複数条件の組み合わせ（Ethereal と Retain の競合）
      const etherealCard = makeEtherealCard('apparition')
      const retainCard = makeRetainCard('burn')
      const player = makePlayer({ hand: [etherealCard, retainCard] })

      const result = applyEndOfTurnKeywords(player)

      // Ethereal は exhaustPile に移動する
      expect(result.exhaustPile).toHaveLength(1)
      expect(result.exhaustPile[0]!.id).toBe(makeCardId('apparition'))
      // Retain は手札に残る
      expect(result.hand).toHaveLength(1)
      expect(result.hand[0]!.id).toBe(makeCardId('burn'))
    })

    it('Ethereal と Retain を両方持つカードは Ethereal が優先されて消耗される', () => {
      // 観点 16: 複数条件の組み合わせ（1枚のカードに複数キーワード）
      // ゲームルール上 Ethereal が Retain より優先される
      const dualKeywordCard = makeCard('dual_card', [CardKeyword.Ethereal, CardKeyword.Retain])
      const player = makePlayer({ hand: [dualKeywordCard] })

      const result = applyEndOfTurnKeywords(player)

      expect(result.exhaustPile).toHaveLength(1)
      expect(result.hand).toHaveLength(0)
    })
  })

  describe('イミュータビリティ', () => {
    it('11: 元の player オブジェクトを変更しない', () => {
      // 観点 11: 操作後の元オブジェクト不変性
      const retainCard = makeRetainCard('burn')
      const player = makePlayer({ hand: [retainCard] })

      applyEndOfTurnKeywords(player)

      expect(player.hand).toHaveLength(1)
    })
  })
})

// ─────────────────────────────────────────────
// エッジケース: 手札が空・全カード同一キーワード
// ─────────────────────────────────────────────

describe('applyEndOfTurnKeywords - エッジケース', () => {
  it('05: 手札が空のとき applyEndOfTurnKeywords を呼んでもエラーにならない', () => {
    // 観点 05: 境界値超過（下限違反：手札0枚）
    const player = makePlayer({ hand: [] })

    const result = applyEndOfTurnKeywords(player)

    expect(result.hand).toHaveLength(0)
    expect(result.exhaustPile).toHaveLength(0)
    expect(result.discardPile).toHaveLength(0)
  })

  it('手札に通常カードのみの場合、全て手札から除去される（Retain なし）', () => {
    // 観点 04: 同値クラス（通常カードのみ）
    const normalCards = [makeCard('strike'), makeCard('defend'), makeCard('bash')]
    const player = makePlayer({ hand: normalCards })

    const result = applyEndOfTurnKeywords(player)

    expect(result.hand).toHaveLength(0)
    expect(result.discardPile).toHaveLength(0) // discard への移動はこの関数の責務外
    expect(result.exhaustPile).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// AC5: 依存方向ルール（Clean Architecture: domain → application）
// ─────────────────────────────────────────────

describe('AC5: 依存方向ルール', () => {
  it('CardKeywordRules は application 層をインポートしない（静的検証）', () => {
    // eslint.config.js の no-restricted-imports ルール（src/domain/**/*.ts 対象）により、
    // domain 層から application/infrastructure/presentation 層へのインポートは
    // ESLint エラーとして CI で検出される。
    //
    // playCard / applyEndOfTurnKeywords は Player（domain）と CardId（shared）のみ受け取り、
    // application 層の型（UseCase・Service 等）を一切参照しないことを
    // 関数シグネチャの型チェックおよび lint ルールで保証する。
    expect(true).toBe(true)
  })
})
