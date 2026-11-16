import { cssObject, numberError, typedEntries, typedFromEntries } from '../core/helpers'
import { toRem } from './others'
import type { Rect } from './types'

/** @param diameter Must be a positive integer. */
export const circle = (diameter: number) =>
  cssObject({ ...rect(diameter, diameter), borderRadius: '50%', overflow: 'hidden' } as const)

/**
 * @param width Must be a positive integer.
 * @param height Must be a positive integer. Defaults to same as `auto`.
 */
export const rect = (width: Rect, height: Rect = 'auto') =>
  cssObject(
    typedFromEntries(
      typedEntries({ width, height }).map(([key, value]): readonly [typeof key, string] => {
        if (typeof value !== 'number') return [key, value]

        numberError({ [key]: value }, 'positive-int')
        return [key, toRem(value)]
      })
    )
  )

/** @param unit Must be an integer. It is multiplied by 0.25rem. */
export const size = (unit: number) => {
  numberError({ unit }, 'int')
  return toRem(unit)
}
