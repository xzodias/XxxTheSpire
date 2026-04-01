import { type Player } from '../../domain/entities/Player'
import { type ISaveRepository } from '../../domain/interfaces/ISaveRepository'

const SAVE_KEY = 'xxx-the-spire-save'
const SAVE_VERSION = 1

type SaveData = {
  readonly version: number
  readonly data: unknown
}

/**
 * localStorageベースのセーブリポジトリ
 *
 * ISaveRepository の実装クラス。
 * バージョン付き JSON としてラン状態を localStorage に永続化する。
 * バージョンフィールドにより将来的なマイグレーション対応が可能。
 *
 * 参照可能な層: domain/interfaces, domain/entities
 */
export class LocalStorageSaveRepository implements ISaveRepository {
  save(state: Player): void {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      data: state,
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  }

  load(): Player | null {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw === null) return null

    let parsed: SaveData
    try {
      parsed = JSON.parse(raw) as SaveData
    } catch {
      return null
    }

    if (parsed.version !== SAVE_VERSION) return null

    // TODO: T51 で SerializedPlayer スキーマによる構造バリデーションと
    // クラスインスタンス再構築（Health/Block/Energy/Gold 等）を実装する。
    return parsed.data as unknown as Player
  }

  delete(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  exists(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }
}
