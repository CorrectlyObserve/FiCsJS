import { typedEntries } from './others'

/**　@remarks Ignores undefined values　*/
export const numberError = (
  numbers: Record<string, number | undefined>,
  condition:
    | 'finite'
    | 'ratio'
    | 'int'
    | 'positive'
    | 'positive-int'
    | 'non-negative'
    | 'non-negative-int'
): void => {
  for (const [key, value] of typedEntries(numbers)) {
    if (value === undefined) continue

    if (!Number.isFinite(value)) throw new RangeError(`The ${key} must be a number...`)
    if (condition === 'finite') continue

    if (condition === 'ratio' && (value < 0 || value > 1))
      throw new RangeError(`The ${key} must be a number between 0 and 1...`)

    if (condition === 'int' && !Number.isInteger(value))
      throw new RangeError(`The ${key} must be an integer...`)

    for (const remaining of ['positive', 'non-negative'] as const)
      if (condition.startsWith(remaining)) {
        if (value < 0 || (remaining === 'positive' && value === 0))
          throw new RangeError(`The ${key} must be a ${remaining} number...`)

        if (condition === `${remaining}-int` && !Number.isInteger(value))
          throw new RangeError(`The ${key} must be a ${remaining} integer...`)

        continue
      }
  }
}
