import { type Result, ok, err } from '../../shared/types'

export class Seed {
  readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Result<Seed> {
    if (value.trim().length === 0) return err('Seed value must not be empty or whitespace')
    return ok(new Seed(value))
  }

  static generate(): Seed {
    return new Seed(crypto.randomUUID())
  }

  static fromString(s: string): Result<Seed> {
    if (s.trim().length === 0) return err('Seed value must not be empty or whitespace')
    return ok(new Seed(s))
  }
}
