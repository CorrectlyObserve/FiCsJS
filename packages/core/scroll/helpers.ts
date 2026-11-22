import { numberError } from '../helpers'
import type { Scroll, SetTimeout } from '../types'
import { FIXED_POINT_SCALE } from './constants'

export const clearTimers = <D extends object, P>(scrollOptions: Scroll.Resolved<D, P>): void => {
  for (const key of ['resize', 'idle', 'scroll', 'reRender', 'settle'] as const) {
    const timer: SetTimeout | undefined = scrollOptions.timers[key]
    if (timer) clearTimeout(timer)
    scrollOptions.timers[key] = undefined
  }

  /** @remarks Sets `scrolling.isActive` to false directly, as its timer was canceled and will no longer fire. */
  scrollOptions.scrolling.isActive = false
}

/**
 * @remarks
 * - The tree stores 1/64 px units as integers, so repeated adds and removals never drift.
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
 * 3. -i     : 1111 0100 (Flipped bits until the first original '1')
 * 4. i & -i : 0000 0100 (Result: 4 (binary: 100). Index 12 manages a range of 4: 9~12)
 * ```
 */
export const fenwickTree = {
  /** @param index Must be a positive integer. */
  add: (tree: number[], index: number, diff: number): void => {
    numberError({ index }, 'positive-int')

    const steps: number = diff * FIXED_POINT_SCALE
    numberError({ steps }, 'int')
    for (let i = index; i < tree.length; i += i & -i) tree[i] += steps
  },
  /** @param index Must be a non-negative integer. */
  sum: (tree: number[], index: number): number => {
    numberError({ index }, 'non-negative-int')

    let sum: number = 0
    for (let i = index; i > 0; i -= i & -i) sum += tree[i]
    return sum / FIXED_POINT_SCALE
  },
  /** @remarks The fenwick tree is 1-indexed. */
  reset: (length: number): number[] => new Array(length + 1).fill(0)
} as const

/** @remarks Returns the first visible item as an anchor, or `undefined` when no item has been measured yet. */
export const getAnchor = <D extends object, P>({
  firstVisible: { key, offset, scrollOffset, visibleRest }
}: Scroll.Resolved<D, P>): Scroll.Anchor | undefined =>
  key !== undefined && offset !== undefined && scrollOffset !== undefined
    ? { key, offset, scrollOffset, visibleRest }
    : undefined

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

export const getScrollMetrics = (root: HTMLElement, isVertical: boolean): Scroll.Metrics => {
  const clientSize: number = (root as any)[
    getProperty({ isVertical, type: 'size', prefix: 'client' })
  ]

  return {
    /** @remarks Takes the absolute value, as scrollLeft counts down from 0 in RTL. */
    scrollOffset: Math.abs(
      (root as any)[getProperty({ isVertical, type: 'start', prefix: 'scroll' })]
    ),
    scrollAmount: (root as any)[getProperty({ isVertical, type: 'size', prefix: 'scroll' })],
    clientSize,
    isUnmeasurable: clientSize === 0
  }
}

export const getProperty = ({
  isVertical,
  type,
  prefix
}: {
  isVertical: boolean
  type: 'size' | 'start'
  prefix?: string
}): string => {
  let property: string = ''

  if (type === 'size') property = isVertical ? 'Height' : 'Width'
  else property = isVertical ? 'Top' : 'Left'

  return prefix ? `${prefix}${property}` : property.toLowerCase()
}

export const isValidNumber = (
  value: number,
  { positive = true }: { positive?: boolean } = {}
): boolean => Number.isFinite(value) && (!positive || value > 0)

/**
 * @remarks
 * Rounds a measured size to the 1/64 px grid, ensuring the Fenwick tree stores an exact binary integer.
 */
export const roundSize = (size: number): number =>
  Math.round(size * FIXED_POINT_SCALE) / FIXED_POINT_SCALE
