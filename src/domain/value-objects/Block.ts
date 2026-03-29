export class Block {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static create(value: number): Block {
    if (!Number.isFinite(value)) throw new Error('Block value must be a finite number')
    if (value < 0) throw new Error('Block value must be 0 or greater')
    return new Block(value)
  }

  absorb(damage: number): { block: Block; remainingDamage: number } {
    if (!Number.isFinite(damage) || damage < 0)
      throw new Error('damage must be a non-negative finite number')
    const absorbed = Math.min(this.value, damage)
    return {
      block: new Block(this.value - absorbed),
      remainingDamage: damage - absorbed,
    }
  }

  add(amount: number): Block {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('amount must be a non-negative finite number')
    return new Block(this.value + amount)
  }

  reset(): Block {
    return new Block(0)
  }
}
