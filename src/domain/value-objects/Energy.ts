export class Energy {
  readonly current: number
  readonly max: number

  private constructor(current: number, max: number) {
    this.current = current
    this.max = max
  }

  static create(current: number, max: number): Energy {
    if (max <= 0) throw new Error('max must be greater than 0')
    if (current < 0) throw new Error('current must be 0 or greater')
    if (current > max) throw new Error('current must not exceed max')
    return new Energy(current, max)
  }

  spend(cost: number): Energy {
    if (cost > this.current) throw new Error('Not enough energy')
    return new Energy(this.current - cost, this.max)
  }

  refill(): Energy {
    return new Energy(this.max, this.max)
  }

  canAfford(cost: number): boolean {
    return cost <= this.current
  }
}
