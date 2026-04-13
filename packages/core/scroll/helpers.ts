import { numberError, joinArray } from '../helpers'
import type { Scroll, SetTimeout } from '../types'

export const clearTimers = <D extends object, P>(scrollOptions: Scroll.Resolved<D, P>): void => {
  for (const key of ['resize', 'idle'] as const) {
    const timer: SetTimeout | undefined = scrollOptions.timers[key]
    if (timer) clearTimeout(timer)
    scrollOptions.timers[key] = undefined
  }
}

/**
 * @remarks
 * - `-i` is mathematically equivalent to `(~i + 1)` in two's complement.
 * - The `~` operator (Bitwise NOT) flips all bits (0 to 1, 1 to 0).
 * - The `&` operator (Bitwise AND) keeps only the bits that are 1 in both operands.
 * - Time Complexity: O(log N).
 *
 * @example
 * Isolating the LSB (Least Significant Bit) of 12 (binary: 1100):
 * ```
 * 1. i      : 0000 1100
 * 2. ~i     : 1111 0011 (Inverted)
 * 3. -i     : 1111 0100 (Flips bits until the first original '1')
 * 4. i & -i : 0000 0100 (Result: 4 (binary: 100). Index 12 manages a range of 4: 9~12)
 * ```
 */
export const fenwickTree = {
  /**
   * @param index Must be a non-negative integer.
   * @param diff Must be an integer.
   */
  add: (tree: number[], index: number, diff: number): void => {
    numberError({ index }, 'positive-int')
    numberError({ diff }, 'int')
    for (let i = index; i < tree.length; i += i & -i) tree[i] += diff
  },
  /** @param index Must be a non-negative integer. */
  sum: (tree: number[], index: number): number => {
    numberError({ index }, 'non-negative-int')

    let sum: number = 0
    for (let i = index; i > 0; i -= i & -i) sum += tree[i]
    return sum
  },
  /** @remarks The fenwick tree is 1-indexed. */
  reset: (length: number): number[] => new Array(length + 1).fill(0)
} as const

export const getAveSize = <D extends object, P>({
  aveSize,
  itemMinSize
}: {
  aveSize: number | undefined
  itemMinSize: number
}): number => {
  if (aveSize === undefined) return itemMinSize
  return Number.isFinite(aveSize) ? aveSize : itemMinSize
}

export const getScrollAttr = ({
  instanceId,
  type,
  hasValue
}: {
  instanceId: string
  type: Scroll.Div
  hasValue: boolean
}): string => `${instanceId}-${type}${hasValue ? '="true"' : ''}`

export const getScrollMetrics = (root: HTMLElement, isVertical: boolean): Scroll.Metrics => ({
  scrollOffset: (root as any)[getProperty({ isVertical, type: 'start', prefix: 'scroll' })],
  scrollAmount: (root as any)[getProperty({ isVertical, type: 'size', prefix: 'scroll' })],
  clientSize: (root as any)[getProperty({ isVertical, type: 'size', prefix: 'client' })]
})

export const getProperty = ({
  isVertical,
  type,
  prefix
}: {
  isVertical: boolean
  type: 'size' | 'start' | 'end'
  prefix?: string
}): string => {
  let property: string = ''
  switch (type) {
    case 'size':
      property = isVertical ? 'height' : 'width'
      break

    case 'start':
      property = isVertical ? 'top' : 'left'
      break

    case 'end':
      property = isVertical ? 'bottom' : 'right'
      break
  }

  return prefix ? `${prefix}${property[0].toUpperCase()}${property.slice(1)}` : property
}

export const isValidNumber = (value: number, isPositiveRequired: boolean = true): boolean =>
  Number.isFinite(value) && (!isPositiveRequired || value > 0)

export const normalizeRootMargin = (rootMargin: string | number | undefined): string => {
  if (typeof rootMargin === 'number')
    return joinArray(new Array(4).fill(`${Number.isFinite(rootMargin) ? rootMargin : 0}px`))

  const split: string[] = (rootMargin ?? '').trim().split(/\s+/)
  if (split.length > 4 || !split[0]) return joinArray(new Array(4).fill('0px'))

  const [top, right, bottom, left]: (string | undefined)[] = split

  if (left) return joinArray(split)
  return joinArray(right || bottom ? [top, right!, bottom ?? top, right!] : new Array(4).fill(top))
}
