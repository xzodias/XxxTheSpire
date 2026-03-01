# XxxTheSpire - 技術要件 & フォルダ構成設計

Slay the Spire風のローグライクデッキ構築ゲームをSPAとして開発する。

---

## 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| 言語 | TypeScript | 型安全な開発 |
| UI | React | メニュー、デッキ一覧、リワード選択等のUI |
| ゲームエンジン | Phaser | 戦闘アニメーション、マップ描画のCanvas |
| 状態管理 | Zustand | React側グローバル状態管理 |
| 不変更新 | Immer | ネスト状態の直感的な更新 |
| ビルド | Vite | 開発サーバー・バンドラー |
| テスト | Vitest | ユニット・統合テスト |
| Lint/Format | ESLint + Prettier | コードスタイル統一 |
| 開発環境 | DevContainer | 統一開発環境 |

---

## 追加技術要件

### 1. React-Phaser統合
- **責務分離**: Phaser = ゲームCanvas / React = UI
- **EventBus**: Phaser ↔ React間のイベント駆動通信（疎結合）

### 2. データ管理
- **マスターデータ**: カード・レリック・敵等の定義をJSON/TSで管理、Zodで型検証
- **セーブ/ロード**: localStorage or IndexedDBで永続化、バージョニング対応
- **乱数シード管理**: seedrandom等でシード付き疑似乱数（再現性確保）

### 3. ゲームロジック
- **ターン管理ステートマシン**: 戦闘フェーズの状態遷移管理
  - プレイヤーターン開始 → カードプレイ → ターン終了 → 敵ターン
- **エフェクトシステム**: カード/レリック/ポーション効果をコマンドパターンで統一処理
- **ダメージ計算パイプライン**: バフ/デバフ/ブロック/脆弱性の修飾子を順序適用

### 4. アセット管理
- スプライト: PNG/WebP
- オーディオ: MP3/OGG
- フォント: Webフォント
- Phaserのプリロード戦略で管理

### 5. パフォーマンス
- **オブジェクトプール**: エフェクトオブジェクトの再利用
- **遅延ロード**: Act切り替え時にアセットを動的ロード

---

## アーキテクチャ

**クリーンアーキテクチャ** の依存関係ルール:

```
domain ← application ← infrastructure / presentation
```

| 層 | 役割 | 外部依存 |
|----|------|---------|
| **domain** | 純粋なビジネスロジック | なし |
| **application** | ユースケース（domain を利用） | domain のみ |
| **infrastructure** | 外部依存の実装（DB, API等） | domain, application |
| **presentation** | UI（React, Phaser） | domain, application |

---

## フォルダ構成

```
XxxTheSpire/
├── .devcontainer/
│   └── devcontainer.json
│
├── src/
│   ├── domain/                          # ドメイン層
│   │   ├── entities/                    #   エンティティ
│   │   │   ├── Card.ts                  #     カード
│   │   │   ├── Relic.ts                 #     レリック
│   │   │   ├── Potion.ts               #     ポーション
│   │   │   ├── Enemy.ts                #     敵
│   │   │   ├── Character.ts            #     キャラクター
│   │   │   ├── Player.ts               #     プレイヤー（ラン中の状態）
│   │   │   ├── Combat.ts               #     戦闘状態
│   │   │   ├── MapNode.ts              #     マップノード
│   │   │   └── StatusEffect.ts         #     状態効果（バフ/デバフ）
│   │   ├── value-objects/               #   値オブジェクト
│   │   │   ├── Energy.ts               #     エネルギー
│   │   │   ├── Health.ts               #     HP（現在/最大）
│   │   │   ├── Block.ts                #     ブロック値
│   │   │   ├── Gold.ts                 #     ゴールド
│   │   │   └── Seed.ts                 #     乱数シード
│   │   ├── enums/                       #   列挙型
│   │   │   ├── CardType.ts             #     Attack/Skill/Power/Status/Curse
│   │   │   ├── Rarity.ts              #     Common/Uncommon/Rare
│   │   │   ├── NodeType.ts            #     Combat/Elite/Event/Shop/Rest/Boss
│   │   │   └── TargetType.ts          #     Single/All/Self/Random
│   │   ├── interfaces/                  #   リポジトリ・サービスIF
│   │   │   ├── ICardRepository.ts
│   │   │   ├── IRelicRepository.ts
│   │   │   ├── ISaveRepository.ts
│   │   │   └── IRandomService.ts
│   │   └── rules/                       #   ドメインルール（純粋関数）
│   │       ├── DamageCalculator.ts      #     ダメージ計算パイプライン
│   │       ├── DeckRules.ts             #     デッキ操作（ドロー/シャッフル/廃棄）
│   │       ├── RewardRules.ts           #     報酬生成
│   │       └── MapGenerator.ts          #     マップ生成アルゴリズム
│   │
│   ├── application/                     # アプリケーション層
│   │   ├── usecases/                    #   ユースケース（1ファイル=1ユースケース）
│   │   │   ├── StartRunUseCase.ts       #     ラン開始
│   │   │   ├── PlayCardUseCase.ts       #     カードプレイ
│   │   │   ├── EndTurnUseCase.ts        #     ターン終了
│   │   │   ├── ExecuteEnemyTurnUseCase.ts #   敵ターン実行
│   │   │   ├── SelectNodeUseCase.ts     #     マップノード選択
│   │   │   ├── SelectRewardUseCase.ts   #     報酬選択
│   │   │   ├── UsePotionUseCase.ts      #     ポーション使用
│   │   │   ├── RestSiteActionUseCase.ts #     休憩所アクション
│   │   │   ├── ShopPurchaseUseCase.ts   #     ショップ購入
│   │   │   └── SaveLoadUseCase.ts       #     セーブ/ロード
│   │   ├── effects/                     #   エフェクトシステム（コマンドパターン）
│   │   │   ├── Effect.ts               #     エフェクト基底IF
│   │   │   ├── DealDamageEffect.ts
│   │   │   ├── GainBlockEffect.ts
│   │   │   ├── ApplyStatusEffect.ts
│   │   │   ├── DrawCardEffect.ts
│   │   │   └── EffectExecutor.ts        #     エフェクト実行エンジン
│   │   └── state-machine/               #   戦闘ステートマシン
│   │       ├── CombatStateMachine.ts
│   │       └── CombatPhase.ts           #     フェーズ定義
│   │
│   ├── infrastructure/                  # インフラ層
│   │   ├── repositories/                #   リポジトリ実装
│   │   │   ├── JsonCardRepository.ts    #     JSONからカードデータ読込
│   │   │   ├── JsonRelicRepository.ts
│   │   │   └── LocalStorageSaveRepository.ts
│   │   ├── services/
│   │   │   └── SeededRandomService.ts   #     シード付き乱数
│   │   └── data/                        #   マスターデータ（JSON）
│   │       ├── cards/
│   │       │   ├── ironclad.json
│   │       │   ├── silent.json
│   │       │   └── colorless.json
│   │       ├── relics.json
│   │       ├── potions.json
│   │       ├── enemies.json
│   │       └── events.json
│   │
│   ├── presentation/                    # プレゼンテーション層
│   │   ├── viewmodels/                  #   ViewModel（Zustandストア）
│   │   │   ├── useCombatViewModel.ts    #     戦闘画面VM
│   │   │   ├── useMapViewModel.ts       #     マップ画面VM
│   │   │   ├── useDeckViewModel.ts      #     デッキ閲覧VM
│   │   │   ├── useRewardViewModel.ts    #     報酬選択VM
│   │   │   └── useRunViewModel.ts       #     ラン全体VM
│   │   ├── react/                       #   React UIコンポーネント
│   │   │   ├── components/              #     共通UI
│   │   │   │   ├── CardDisplay.tsx
│   │   │   │   ├── HealthBar.tsx
│   │   │   │   ├── EnergyDisplay.tsx
│   │   │   │   ├── RelicIcon.tsx
│   │   │   │   └── PotionSlot.tsx
│   │   │   ├── screens/                 #     画面単位
│   │   │   │   ├── TitleScreen.tsx
│   │   │   │   ├── CharacterSelectScreen.tsx
│   │   │   │   ├── MapScreen.tsx
│   │   │   │   ├── CombatScreen.tsx
│   │   │   │   ├── RewardScreen.tsx
│   │   │   │   ├── ShopScreen.tsx
│   │   │   │   ├── RestSiteScreen.tsx
│   │   │   │   └── EventScreen.tsx
│   │   │   ├── overlays/                #     オーバーレイUI
│   │   │   │   ├── DeckViewOverlay.tsx
│   │   │   │   ├── DiscardPileOverlay.tsx
│   │   │   │   └── SettingsOverlay.tsx
│   │   │   └── App.tsx
│   │   └── phaser/                      #   Phaserゲームシーン
│   │       ├── PhaserGame.ts            #     Phaser初期化・設定
│   │       ├── scenes/
│   │       │   ├── BootScene.ts         #     アセットプリロード
│   │       │   ├── CombatScene.ts       #     戦闘アニメーション
│   │       │   └── MapScene.ts          #     マップ描画
│   │       ├── objects/
│   │       │   ├── CardSprite.ts
│   │       │   ├── EnemySprite.ts
│   │       │   └── EffectAnimation.ts
│   │       └── EventBus.ts              #     Phaser ↔ React通信
│   │
│   ├── shared/                          # 層横断ユーティリティ
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── constants.ts                 #   ゲーム定数
│   │
│   ├── di/
│   │   └── container.ts                 #   DIコンテナ
│   │
│   └── main.tsx                         # エントリーポイント
│
├── public/assets/                       # 静的アセット
│   ├── sprites/
│   ├── audio/
│   └── fonts/
│
├── tests/                               # テスト
│   ├── domain/
│   │   ├── rules/
│   │   │   └── DamageCalculator.test.ts
│   │   └── entities/
│   ├── application/
│   │   └── usecases/
│   └── integration/
│
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 実装順序

### Step 1: プロジェクト初期化
| ファイル | 内容 |
|---------|------|
| `package.json` | Vite + React + Phaser + Zustand + Vitest の依存定義 |
| `vite.config.ts` | Viteビルド設定 |
| `vitest.config.ts` | テスト設定 |
| `tsconfig.json` | TypeScript設定 |
| `.devcontainer/devcontainer.json` | DevContainer設定 |
| `.eslintrc.cjs` / `.prettierrc` | Lint/Format設定 |
| `index.html` / `main.tsx` | エントリーポイント |

### Step 2: ドメイン層の基盤
| ファイル | 内容 |
|---------|------|
| `domain/entities/*` | 全エンティティの型定義 |
| `domain/value-objects/*` | Health, Energy等の値オブジェクト |
| `domain/enums/*` | CardType, Rarity等の列挙型 |
| `domain/interfaces/*` | リポジトリ・サービスのインターフェース |
| `domain/rules/DamageCalculator.ts` | ダメージ計算（テスト駆動で実装） |

### Step 3: アプリケーション層の基盤
| ファイル | 内容 |
|---------|------|
| `application/effects/Effect.ts` | エフェクト基底インターフェース |
| `application/effects/EffectExecutor.ts` | エフェクト実行エンジン |
| `application/state-machine/CombatStateMachine.ts` | 戦闘ステートマシン |
| `application/state-machine/CombatPhase.ts` | フェーズ定義 |

### Step 4: インフラ層
| ファイル | 内容 |
|---------|------|
| `infrastructure/data/*` | マスターデータJSON |
| `infrastructure/repositories/*` | リポジトリ実装 |
| `infrastructure/services/SeededRandomService.ts` | シード付き乱数 |

### Step 5: プレゼンテーション層の基盤
| ファイル | 内容 |
|---------|------|
| `presentation/phaser/EventBus.ts` | React-Phaser通信 |
| `presentation/phaser/PhaserGame.ts` | Phaser初期化 |
| `presentation/viewmodels/*` | ViewModel（Zustandストア） |
| `presentation/react/App.tsx` | ルートコンポーネント |

---

## 検証方法

| コマンド | 確認内容 |
|---------|---------|
| `npm run dev` | Vite開発サーバー起動、React + Phaserが同時動作 |
| `npm run test` | Vitestによるドメイン層ユニットテストが通る |
| `npm run lint` | ESLintエラーがない |

---

## 主要な設計パターン

### コマンドパターン（エフェクトシステム）
カード・レリック・ポーションの効果を統一的に処理する。
各エフェクトは `Effect` インターフェースを実装し、`EffectExecutor` が順次実行する。

### ステートマシン（戦闘管理）
```
PlayerTurnStart → PlayerAction → PlayerTurnEnd → EnemyTurn → (ループ)
```

### ダメージ計算パイプライン
```
基礎ダメージ → 筋力修飾 → 脆弱性修飾 → ブロック適用 → 最終ダメージ
```

### EventBus（React-Phaser通信）
```
React → EventBus.emit('playCard', card) → Phaser（アニメーション再生）
Phaser → EventBus.emit('animationComplete') → React（UI更新）
```
