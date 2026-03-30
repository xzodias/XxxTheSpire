/**
 * シード付き乱数生成サービスのインターフェース。
 * domain/application 層がこのIFに依存し、infrastructure 層が実装を提供する。
 */
export interface IRandomService {
  /** 0以上1未満の乱数を返す */
  next(): number

  /**
   * min以上max以下の整数乱数を返す（両端を含む）。
   * @param min - 下限（整数）
   * @param max - 上限（整数）
   * @throws {RangeError} min > max の場合
   */
  nextInt(min: number, max: number): number

  /** 配列をシャッフルした新しい配列を返す（元の配列を変更しない） */
  shuffle<T>(array: readonly T[]): readonly T[]
}
