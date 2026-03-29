export class Seed {
  readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Seed {
    if (value.length === 0) throw new Error('Seed value must not be empty')
    return new Seed(value)
  }

  static generate(): Seed {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).slice(2)
    return new Seed(`${timestamp}-${random}`)
  }

  static fromString(s: string): Seed {
    if (s.length === 0) throw new Error('Seed value must not be empty')
    return new Seed(s)
  }
}
