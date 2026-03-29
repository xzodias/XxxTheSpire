export class Gold {
  readonly amount: number

  private constructor(amount: number) {
    this.amount = amount
  }

  static create(amount: number): Gold {
    if (!Number.isFinite(amount)) throw new Error('Gold amount must be a finite number')
    if (amount < 0) throw new Error('Gold amount must be 0 or greater')
    return new Gold(amount)
  }

  add(amount: number): Gold {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('amount must be a non-negative finite number')
    return new Gold(this.amount + amount)
  }

  spend(amount: number): Gold {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('amount must be a non-negative finite number')
    if (amount > this.amount) throw new Error('Not enough gold')
    return new Gold(this.amount - amount)
  }

  canAfford(price: number): boolean {
    if (!Number.isFinite(price) || price < 0) return false
    return price <= this.amount
  }
}
