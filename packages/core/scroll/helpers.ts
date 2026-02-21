import { numberError } from '../helpers'
import type { Scroll } from '../types'

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
  add: (tree: number[], index: number, diff: number): void => {
    numberError({ index }, false)
    for (let i = index; i < tree.length; i += i & -i) tree[i] += diff
  },
  sum: (tree: number[], index: number): number => {
    numberError({ index }, false)

    let sum: number = 0
    for (let i = index; i > 0; i -= i & -i) sum += tree[i]
    return sum
  },
  /**
   * @remarks The fenwick tree are 1-indexed.
   */
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
  scrollOffset: root[`scroll${isVertical ? 'Top' : 'Left'}`],
  scrollAmount: root[`scroll${isVertical ? 'Height' : 'Width'}`],
  clientSize: root[`client${isVertical ? 'Height' : 'Width'}`]
})

export const isValidNumber = (value: number): boolean => Number.isFinite(value) && value > 0
