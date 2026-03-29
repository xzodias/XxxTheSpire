export class Block {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static create(value: number): Block {
    if (value < 0) throw new Error('Block value must be 0 or greater')
    return new Block(value)
  }

  absorb(damage: number): { block: Block; remainingDamage: number } {
    const absorbed = Math.min(this.value, damage)
    return {
      block: new Block(this.value - absorbed),
      remainingDamage: damage - absorbed,
    }
  }

  add(amount: number): Block {
    return new Block(this.value + amount)
  }

  reset(): Block {
    return new Block(0)
  }
}
