import seedrandom from 'seedrandom'
import type { IRandomService } from '../../domain/interfaces/IRandomService'
import type { Seed } from '../../domain/value-objects/Seed'

/**
 * seedrandom ライブラリを使用したシード付き乱数サービスの実装。
 * 同一シードから同一シーケンスを再現できるため、テスト・リプレイに利用可能。
 *
 * @remarks
 * **注意: このサービスは暗号学的に安全ではありません。**
 * seedrandom は決定論的な疑似乱数生成器であり、トークン生成・鍵導出・
 * 賞品抽選など、セキュリティ要件がある用途には使用しないでください。
 * そのような場合は `crypto.getRandomValues` を直接使用してください。
 */
export class SeededRandomService implements IRandomService {
  readonly seed: string
  private readonly rng: seedrandom.PRNG

  constructor(seed: Seed) {
    this.seed = seed.value
    this.rng = seedrandom(seed.value)
  }

  next(): number {
    return this.rng()
  }

  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new RangeError(`min and max must be integers (got min=${min}, max=${max})`)
    }
    if (min > max) {
      throw new RangeError(`min (${min}) must not be greater than max (${max})`)
    }
    return Math.floor(this.rng() * (max - min + 1)) + min
  }

  shuffle<T>(array: readonly T[]): readonly T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      // Indices i and j are guaranteed in-bounds by loop invariant
      const tmp = result[i]!
      result[i] = result[j]!
      result[j] = tmp
    }
    return result
  }
}
