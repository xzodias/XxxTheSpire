import { type Result, ok, err } from '../../shared/types'

export class Energy {
  readonly current: number
  readonly max: number

  private constructor(current: number, max: number) {
    this.current = current
    this.max = max
  }

  static create(current: number, max: number): Result<Energy> {
    if (!Number.isFinite(current) || !Number.isFinite(max))
      return err('values must be finite numbers')
    if (max <= 0) return err('max must be greater than 0')
    if (current < 0) return err('current must be 0 or greater')
    if (current > max) return err('current must not exceed max')
    return ok(new Energy(current, max))
  }

  spend(cost: number): Result<Energy> {
    if (!Number.isFinite(cost) || cost < 0)
      throw new Error('cost must be a non-negative finite number')
    if (cost > this.current) return err('not enough energy')
    return ok(new Energy(this.current - cost, this.max))
  }

  refill(): Energy {
    return new Energy(this.max, this.max)
  }

  canAfford(cost: number): boolean {
    if (!Number.isFinite(cost) || cost < 0) return false
    return cost <= this.current
  }
}
