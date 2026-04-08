// Hand & Deck
export const MAX_HAND_SIZE = 10
export const STARTING_DRAW_COUNT = 5
export const DECK_MINIMUM_SIZE = 1

// Energy
// STARTING_ENERGY and MAX_ENERGY are intentionally separate —
// relics/upgrades can raise MAX_ENERGY without changing the starting value.
export const STARTING_ENERGY = 3
export const MAX_ENERGY = 3

// HP
export const MAX_HP_CAP = 999

// Gold
export const STARTING_GOLD = 99

// Potions
export const MAX_POTIONS = 3

// Rewards
export const CARD_REWARD_COUNT = 3
export const BOSS_RELIC_CHOICES = 3

// Map
export const MAP_FLOORS_PER_ACT = 15
export const MAP_WIDTH = 7
export const TOTAL_ACTS = 3

// Shop
export const SHOP_CARD_COUNT = 5
export const SHOP_RELIC_COUNT = 3
export const SHOP_POTION_COUNT = 2
export const SHOP_REMOVE_COST = 75

// Rest Site
export const REST_HEAL_PERCENT = 0.3

// Phaser
export const PHASER_BACKGROUND_COLOR = '#1a1a2e'
export const PHASER_CANVAS_Z_INDEX = 5

// Scene keys — Phaser シーンのキー定数
export const SceneKey = {
  Boot: 'BootScene',
  Map: 'MapScene',
} as const
export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey]
