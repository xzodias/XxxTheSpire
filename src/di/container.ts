import { type ICardRepository } from '../domain/interfaces/ICardRepository'
import { type IRandomService } from '../domain/interfaces/IRandomService'
import { type IRelicRepository } from '../domain/interfaces/IRelicRepository'
import { type ISaveRepository } from '../domain/interfaces/ISaveRepository'
import type { Seed } from '../domain/value-objects/Seed'
import { JsonCardRepository } from '../infrastructure/repositories/JsonCardRepository'
import { JsonRelicRepository } from '../infrastructure/repositories/JsonRelicRepository'
import { LocalStorageSaveRepository } from '../infrastructure/repositories/LocalStorageSaveRepository'
import { SeededRandomService } from '../infrastructure/services/SeededRandomService'
import { StartRunUseCase } from '../application/usecases/StartRunUseCase'

// NOTE: StartRunUseCase は具象クラス型で公開している（IStartRunUseCase インターフェース化は不要）。
// UseCase はリポジトリと異なり実装の差し替え需要がなく、テストは UseCase 単体にモック依存を渡す形で行う。
// この設計判断は意識的なもの（architect レビュー承認済み）。

/**
 * DIコンテナの型定義
 *
 * createContainer が返す全サービス・ユースケースの集合型。
 * presentation 層はこの型を通じて依存を受け取る。
 */
export type Container = {
  readonly randomService: IRandomService
  readonly cardRepository: ICardRepository
  readonly relicRepository: IRelicRepository
  readonly saveRepository: ISaveRepository
  readonly startRunUseCase: StartRunUseCase // 具象クラス型（意識的設計。上記 NOTE 参照）
}

/**
 * DIコンテナファクトリ
 *
 * ランごとに呼び出し、全インフラ実装・ユースケースをワイヤリングして返す。
 * 手動DI（ライブラリ不使用）により TypeScript の型安全性を完全に活用できる。
 *
 * @param seed - ランのシード。SeededRandomService の決定論的再現性を保証するために必須。
 *
 * @remarks
 * **参照可能な層**: 全層（DI層として特別扱い）
 * presentationから呼ばれる唯一のエントリポイント。
 */
export function createContainer(seed: Seed): Container {
  const randomService = new SeededRandomService(seed)
  const cardRepository = new JsonCardRepository()
  const relicRepository = new JsonRelicRepository()
  const saveRepository = new LocalStorageSaveRepository()

  const startRunUseCase = new StartRunUseCase(cardRepository)

  return {
    randomService,
    cardRepository,
    relicRepository,
    saveRepository,
    startRunUseCase,
  }
}
