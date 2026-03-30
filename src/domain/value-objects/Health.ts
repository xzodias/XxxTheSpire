import { type Result, ok, err } from '../../shared/types'

export class Health {
  readonly current: number
  readonly max: number

  private constructor(current: number, max: number) {
    this.current = current
    this.max = max
  }

  static create(current: number, max: number): Result<Health> {
    if (max <= 0) return err('max must be greater than 0')
    if (current < 0) return err('current must be 0 or greater')
    if (current > max) return err('current must not exceed max')
    return ok(new Health(current, max))
  }

  takeDamage(amount: number): Health {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
    return new Health(Math.max(0, this.current - safeAmount), this.max)
  }

  heal(amount: number): Health {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
    return new Health(Math.min(this.max, this.current + safeAmount), this.max)
  }

  isDead(): boolean {
    return this.current === 0
  }
}
