/**
 * useBattleViewModel テスト（AC4: ダメージ計算結果が UI の HP 表示に反映される）
 *
 * useBattleViewModel は未実装のため、このテストは現時点で RED（失敗）になる。
 * 実装時は Zustand + Immer を使用し、initBattle / playCard アクションを提供すること。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBattleViewModel } from '../../../src/presentation/viewmodels/useBattleViewModel'
import { type Player } from '../../../src/domain/entities/Player'
import { type Enemy } from '../../../src/domain/entities/Enemy'
import { type Card } from '../../../src/domain/entities/Card'
import { type StatusEffect, StatusEffectType } from '../../../src/domain/entities/StatusEffect'
import { type IRandomService } from '../../../src/domain/interfaces/IRandomService'
import { type EnemyId, type Target, type StatusEffectId } from '../../../src/shared/types'
import { Health } from '../../../src/domain/value-objects/Health'
import { Block } from '../../../src/domain/value-objects/Block'
import { Energy } from '../../../src/domain/value-objects/Energy'
import { Gold } from '../../../src/domain/value-objects/Gold'

// ─────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────

function makeEnemyId(id: string): EnemyId {
  return id as EnemyId
}

function makeStatusEffect(type: StatusEffectType, stacks: number, duration: number): StatusEffect {
  return {
    id: `${type}_test` as StatusEffectId,
    name: type,
    type,
    stacks,
    duration,
  }
}

function makeEnemy(
  id: string,
  overrides?: Partial<{
    currentHp: number
    maxHp: number
    block: number
    statusEffects: StatusEffect[]
  }>,
): Enemy {
  const hp = Health.create(overrides?.currentHp ?? 50, overrides?.maxHp ?? 50)
  const block = Block.create(overrides?.block ?? 0)
  if (!hp.ok) throw new Error('Failed to create health')
  if (!block.ok) throw new Error('Failed to create block')

  return {
    id,
    name: `Enemy_${id}`,
    enemyId: makeEnemyId(id),
    intent: { type: 'unknown' },
    health: hp.value,
    block: block.value,
    powers: [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makePlayer(
  overrides?: Partial<{ currentHp: number; block: number; statusEffects: StatusEffect[] }>,
): Player {
  const health = Health.create(overrides?.currentHp ?? 80, 80)
  const energy = Energy.create(3, 3)
  const gold = Gold.create(0)
  const block = Block.create(overrides?.block ?? 0)
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
    deck: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    maxPotionSlots: 3,
    potions: [null, null, null],
    powers: [],
    statusEffects: overrides?.statusEffects ?? [],
  }
}

function makeRandomService(): IRandomService {
  return {
    next: vi.fn(() => 0),
    nextInt: vi.fn((min: number) => min),
    shuffle: vi.fn(<T>(array: readonly T[]): readonly T[] => [
      ...array,
    ]) as IRandomService['shuffle'],
  }
}

/** ダメージカード（単体攻撃）のスタブ */
function makeDamageCard(amount: number): Card {
  return {
    id: `strike_${amount}`,
    name: 'Strike',
    cost: 1,
    description: `Deal ${amount} damage.`,
    effects: [{ type: 'damage', value: amount }],
    keywords: [],
  } as unknown as Card
}

/** ブロックカード（プレイヤー自身）のスタブ */
function makeBlockCard(amount: number): Card {
  return {
    id: `defend_${amount}`,
    name: 'Defend',
    cost: 1,
    description: `Gain ${amount} block.`,
    effects: [{ type: 'block', value: amount }],
    keywords: [],
  } as unknown as Card
}

/** 全体攻撃カードのスタブ */
function makeAllEnemiesCard(amount: number): Card {
  return {
    id: `cleave_${amount}`,
    name: 'Cleave',
    cost: 1,
    description: `Deal ${amount} damage to ALL enemies.`,
    effects: [{ type: 'all_enemies_damage', value: amount }],
    keywords: [],
  } as unknown as Card
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // ストアをリセット
  useBattleViewModel.setState({
    battleData: { status: 'idle' },
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — 初期状態
// ─────────────────────────────────────────────

describe('useBattleViewModel - 初期状態', () => {
  it('battleData.status が "idle" である', () => {
    const { battleData } = useBattleViewModel.getState()
    expect(battleData.status).toBe('idle')
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — initBattle アクション
// ─────────────────────────────────────────────

describe('useBattleViewModel - initBattle', () => {
  it('観点01: initBattle を呼ぶと battleData.status が "active" になる', () => {
    const player = makePlayer()
    const enemies = [makeEnemy('jaw_worm')]
    useBattleViewModel.getState().initBattle(player, enemies, makeRandomService())

    const { battleData } = useBattleViewModel.getState()
    expect(battleData.status).toBe('active')
  })

  it('観点01: initBattle 後に player の HP が UI に反映される', () => {
    const player = makePlayer({ currentHp: 72 })
    const enemies = [makeEnemy('jaw_worm', { currentHp: 42 })]
    useBattleViewModel.getState().initBattle(player, enemies, makeRandomService())

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.health.current).toBe(72)
  })

  it('観点01: initBattle 後に enemies の HP が UI に反映される', () => {
    const player = makePlayer()
    const enemies = [makeEnemy('jaw_worm', { currentHp: 42, maxHp: 50 })]
    useBattleViewModel.getState().initBattle(player, enemies, makeRandomService())

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const enemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(enemy?.health.current).toBe(42)
  })

  it('観点11: initBattle は引数の player/enemies オブジェクトを変更しない（イミュータビリティ）', () => {
    const player = makePlayer({ currentHp: 80 })
    const enemies = [makeEnemy('jaw_worm', { currentHp: 50 })]
    const originalPlayerHp = player.health.current
    const originalEnemyHp = enemies[0]?.health.current

    useBattleViewModel.getState().initBattle(player, enemies, makeRandomService())

    expect(player.health.current).toBe(originalPlayerHp)
    expect(enemies[0]?.health.current).toBe(originalEnemyHp)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC1 ブロック軽減
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC1 ブロック軽減', () => {
  it('観点01: ブロックがある敵にダメージカードをプレイするとブロック分が軽減される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 5 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    // damage=10, block=5 → HP は 50 - (10-5) = 45
    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(45)
    expect(resultEnemy?.block.value).toBe(0)
  })

  it('観点04: ブロック > ダメージ のとき HP は変わらずブロックだけ減る（中間値）', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 20 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(50)
    expect(resultEnemy?.block.value).toBe(10)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC2 筋力バフ/デバフ
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC2 筋力バフ/デバフ', () => {
  it('観点01: プレイヤーが Strength(stacks=3) のとき UI に正しいダメージ後 HP が反映される', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Strength, 3, 0)],
    })
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    // base=6, +3 strength → damage=9
    const card = makeDamageCard(6)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(41)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC3 脆弱（Vulnerable）
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC3 脆弱（Vulnerable）', () => {
  it('観点01: Vulnerable な敵への攻撃ダメージが 1.5倍（floor）になり UI に反映される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', {
      currentHp: 50,
      maxHp: 50,
      block: 0,
      statusEffects: [makeStatusEffect(StatusEffectType.Vulnerable, 0, 1)],
    })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    // base=10, floor(10 * 1.5) = 15
    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(35)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC4 HP 表示への反映
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC4 HP 表示への反映', () => {
  it('観点01: ダメージカードをプレイするたびに battleData.enemies の HP が更新される', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const card = makeDamageCard(6)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const state1 = useBattleViewModel.getState()
    if (state1.battleData.status !== 'active') throw new Error('expected active')
    expect(
      state1.battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current,
    ).toBe(44)

    useBattleViewModel.getState().playCard(card, target)

    const state2 = useBattleViewModel.getState()
    if (state2.battleData.status !== 'active') throw new Error('expected active')
    expect(
      state2.battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current,
    ).toBe(38)
  })

  it('観点01: ブロックカードをプレイすると battleData.player のブロックが更新される', () => {
    const player = makePlayer({ block: 0 })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const card = makeBlockCard(5)
    useBattleViewModel.getState().playCard(card, { kind: 'player' })

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.block.value).toBe(5)
  })

  it('観点11: playCard は元の BattleState に相当するデータを変更しない（イミュータビリティ）', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const stateBeforePlay = useBattleViewModel.getState()
    if (stateBeforePlay.battleData.status !== 'active') throw new Error('expected active')
    const originalEnemy = stateBeforePlay.battleData.enemies.find(
      (e) => e.enemyId === makeEnemyId('jaw_worm'),
    )
    const originalHp = originalEnemy?.health.current

    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    // 旧スナップショットの enemy は変更されていない
    expect(originalEnemy?.health.current).toBe(originalHp)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC5 弱体化（Weak）
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC5 弱体化（Weak）', () => {
  it('観点01: Weak なプレイヤーがダメージカードをプレイすると 25%減のダメージが UI に反映される', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Weak, 0, 1)],
    })
    const enemy = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    // base=10, floor(10 * 0.75) = 7
    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(card, target)

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    expect(resultEnemy?.health.current).toBe(43)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC6 俊敏（Dexterity）
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC6 俊敏（Dexterity）', () => {
  it('観点01: Dexterity(stacks=2) なプレイヤーがブロックカードをプレイすると base+2 のブロックが UI に反映される', () => {
    const player = makePlayer({
      statusEffects: [makeStatusEffect(StatusEffectType.Dexterity, 2, 0)],
    })
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    // base=5, +2 dexterity → block=7
    const card = makeBlockCard(5)
    useBattleViewModel.getState().playCard(card, { kind: 'player' })

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(battleData.player.block.value).toBe(7)
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — playCard: AC7 全体攻撃
// ─────────────────────────────────────────────

describe('useBattleViewModel - playCard: AC7 全体攻撃', () => {
  it('観点01: 全体攻撃カードをプレイすると全ての敵のHPが UI に反映される', () => {
    const player = makePlayer()
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy1, enemy2], makeRandomService())

    const card = makeAllEnemiesCard(8)
    useBattleViewModel.getState().playCard(card, { kind: 'all' })

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(
      battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current,
    ).toBe(42)
    expect(battleData.enemies.find((e) => e.enemyId === makeEnemyId('louse'))?.health.current).toBe(
      22,
    )
  })

  it('観点04: 全体攻撃で各敵のブロックが個別に消費される（中間値）', () => {
    const player = makePlayer()
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 3 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 15 })
    useBattleViewModel.getState().initBattle(player, [enemy1, enemy2], makeRandomService())

    // damage=10: enemy1 block=3→0, hp 50-7=43; enemy2 block=15>10, hp unchanged block=5
    const card = makeAllEnemiesCard(10)
    useBattleViewModel.getState().playCard(card, { kind: 'all' })

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    const resultEnemy1 = battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))
    const resultEnemy2 = battleData.enemies.find((e) => e.enemyId === makeEnemyId('louse'))
    expect(resultEnemy1?.health.current).toBe(43)
    expect(resultEnemy1?.block.value).toBe(0)
    expect(resultEnemy2?.health.current).toBe(30)
    expect(resultEnemy2?.block.value).toBe(5)
  })

  it('観点02: 全体攻撃 value=0 のとき全ての敵のHP・ブロックは変わらない（境界値）', () => {
    const player = makePlayer()
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 5 })
    const enemy2 = makeEnemy('louse', { currentHp: 30, maxHp: 30, block: 0 })
    useBattleViewModel.getState().initBattle(player, [enemy1, enemy2], makeRandomService())

    const card = makeAllEnemiesCard(0)
    useBattleViewModel.getState().playCard(card, { kind: 'all' })

    const { battleData } = useBattleViewModel.getState()
    if (battleData.status !== 'active') throw new Error('expected active')
    expect(
      battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health.current,
    ).toBe(50)
    expect(battleData.enemies.find((e) => e.enemyId === makeEnemyId('louse'))?.health.current).toBe(
      30,
    )
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — エラー状態（観点33）
// ─────────────────────────────────────────────

describe('useBattleViewModel - エラー状態（#3: EffectFactory 失敗時）', () => {
  it('未知のエフェクトタイプを持つカードをプレイすると battleData.status が "error" になる', () => {
    const player = makePlayer()
    const enemy = makeEnemy('jaw_worm')
    useBattleViewModel.getState().initBattle(player, [enemy], makeRandomService())

    const badCard = {
      id: 'bad_card',
      name: 'Bad',
      cost: 1,
      description: '',
      effects: [{ type: 'unknown_effect', value: 10 }],
      keywords: [],
    } as unknown as import('../../../src/domain/entities/Card').Card

    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }
    useBattleViewModel.getState().playCard(badCard, target)

    const { battleData } = useBattleViewModel.getState()
    expect(battleData.status).toBe('error')
    if (battleData.status === 'error') {
      expect(battleData.reason.length).toBeGreaterThan(0)
      expect(battleData.reason[0]).toContain('unknown_effect')
    }
  })
})

// ─────────────────────────────────────────────
// useBattleViewModel — 冪等性（観点28）
// ─────────────────────────────────────────────

describe('useBattleViewModel - 冪等性（観点28）', () => {
  it('同じ初期状態から同じカードをプレイすると毎回同じ結果になる', () => {
    const card = makeDamageCard(10)
    const target: Target = { kind: 'enemy', id: makeEnemyId('jaw_worm') }

    // 1回目
    const player1 = makePlayer()
    const enemy1 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    useBattleViewModel.getState().initBattle(player1, [enemy1], makeRandomService())
    useBattleViewModel.getState().playCard(card, target)
    const state1 = useBattleViewModel.getState()
    if (state1.battleData.status !== 'active') throw new Error('expected active')
    const hp1 = state1.battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health
      .current

    // 2回目（リセット後）
    useBattleViewModel.setState({ battleData: { status: 'idle' } })
    const player2 = makePlayer()
    const enemy2 = makeEnemy('jaw_worm', { currentHp: 50, maxHp: 50, block: 0 })
    useBattleViewModel.getState().initBattle(player2, [enemy2], makeRandomService())
    useBattleViewModel.getState().playCard(card, target)
    const state2 = useBattleViewModel.getState()
    if (state2.battleData.status !== 'active') throw new Error('expected active')
    const hp2 = state2.battleData.enemies.find((e) => e.enemyId === makeEnemyId('jaw_worm'))?.health
      .current

    expect(hp1).toBe(hp2)
  })
})
