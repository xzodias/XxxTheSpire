export class Seed {
  readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Seed {
    if (value.trim().length === 0) throw new Error('Seed value must not be empty or whitespace')
    return new Seed(value)
  }

  static generate(): Seed {
    return new Seed(crypto.randomUUID())
  }

  static fromString(s: string): Seed {
    if (s.trim().length === 0) throw new Error('Seed value must not be empty or whitespace')
    return new Seed(s)
  }
}
