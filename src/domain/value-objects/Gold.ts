export class Gold {
  readonly amount: number

  private constructor(amount: number) {
    this.amount = amount
  }

  static create(amount: number): Gold {
    if (amount < 0) throw new Error('Gold amount must be 0 or greater')
    return new Gold(amount)
  }

  add(amount: number): Gold {
    return new Gold(this.amount + amount)
  }

  spend(amount: number): Gold {
    if (amount > this.amount) throw new Error('Not enough gold')
    return new Gold(this.amount - amount)
  }

  canAfford(price: number): boolean {
    return price <= this.amount
  }
}
