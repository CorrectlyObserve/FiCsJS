import { numberError } from '../helpers'
import type { Scroll } from '../types'
import { FIXED_POINT_SCALE, SAVED_SIZES_LIMIT } from './constants'
import { fenwickTree } from './helpers'

const rebuildTrees = (cache: Scroll.Cache): void => {
  const { measuredSizes }: Scroll.Cache = cache,
    trees = {} as Scroll.Cache['trees']

  for (const tree of ['sizes', 'counts'] as (keyof Scroll.Cache['trees'])[])
    trees[tree] = fenwickTree.reset(measuredSizes.length)

  for (const [index, size] of measuredSizes.entries()) {
    /** @remarks The fenwick tree is 1-indexed. */
    const treeIndex: number = index + 1

    /** @remarks Adds the lowest 1 bit, which gives the larger subtotal that contains this one. */
    const containingIndex: number = treeIndex + (treeIndex & -treeIndex)

    if (!Number.isNaN(size)) {
      const steps: number = size * FIXED_POINT_SCALE

      /** @remarks Calls the numberError function only on a bad value, as calling it every time is too slow. */
      if (!Number.isInteger(steps)) numberError({ steps }, 'int')

      trees.sizes[treeIndex] += steps
      /** @remarks Adds 64 for one item, as the sum function divides every tree by `FIXED_POINT_SCALE`. */
      trees.counts[treeIndex] += FIXED_POINT_SCALE
    }

    if (containingIndex < trees.sizes.length)
      for (const tree of ['sizes', 'counts'] as (keyof Scroll.Cache['trees'])[])
        trees[tree][containingIndex] += trees[tree][treeIndex]
  }

  cache.trees = trees
}

/**
 * @param totalCount Must be a non-negative integer.
 * @param index Must be a non-negative integer.
 * @param aveSize Must be a positive number.
 */
export const estimateOffsetBeforeIndex = ({
  cache: {
    trees: { sizes, counts }
  },
  totalCount,
  index,
  aveSize
}: Scroll.Ctx.OffsetBeforeIndex): number => {
  numberError({ totalCount, index }, 'non-negative-int')
  numberError({ aveSize }, 'positive')

  const clampedIndex: number = Math.min(index, totalCount),
    measuredSize: number = fenwickTree.sum(sizes, clampedIndex),
    measuredCount: number = fenwickTree.sum(counts, clampedIndex)

  return measuredSize + (clampedIndex - measuredCount) * aveSize
}

export const resetCache = (cache: Scroll.Cache): void => {
  cache.measuredSizes.fill(Number.NaN)
  cache.sizesByKey.clear()
  cache.elementIndexes = new WeakMap()
  rebuildTrees(cache)
}

export const setSize = ({
  cache,
  index,
  key,
  size
}: {
  cache: Scroll.Cache
  index: number
  key: Scroll.Key
  size: number
}): number | undefined => {
  cache.sizesByKey.set(key, size)

  const prevSize: number = cache.measuredSizes[index]
  if (prevSize === size) return prevSize

  cache.measuredSizes[index] = size

  const isMeasured: boolean = Number.isFinite(prevSize)
  fenwickTree.add(cache.trees.sizes, index + 1, size - (isMeasured ? prevSize : 0))

  if (isMeasured) return prevSize

  fenwickTree.add(cache.trees.counts, index + 1, 1)
  return undefined
}

export const syncCache = <T>(
  cache: Scroll.Cache,
  items: readonly T[],
  getKey: (item: T) => Scroll.Key
): void => {
  const { items: prevItems, keys: prevKeys, sizesByKey }: Scroll.Cache = cache,
    isSameArray: boolean = items === prevItems && items.length === prevKeys.length

  if (isSameArray) return

  const keys: Scroll.Key[] = new Array(items.length)
  let isAppended: boolean = items.length >= prevKeys.length

  for (let index = 0; index < items.length; index++) {
    const item: T = items[index]

    keys[index] =
      items !== prevItems && item === prevItems?.[index] ? prevKeys[index] : getKey(item)

    const isReplaced: boolean = index < prevKeys.length && keys[index] !== prevKeys[index]
    if (isReplaced) isAppended = false
  }

  cache.items = items
  cache.keys = keys

  if (isAppended) {
    const { measuredSizes }: Scroll.Cache = cache

    if (keys.length > measuredSizes.length) {
      /**
       * @remarks
       * Grows by at least 2x to keep tree rebuilds infrequent, as every expansion triggers a rebuild.
       */
      const nextLength: number = Math.max(keys.length, measuredSizes.length * 2)

      while (measuredSizes.length < nextLength) measuredSizes.push(Number.NaN)
      rebuildTrees(cache)
    }

    for (let index = prevKeys.length; index < keys.length; index++) {
      const key: Scroll.Key = keys[index],
        size: number | undefined = sizesByKey.get(key)

      if (size !== undefined) setSize({ cache, index, key, size })
    }

    return
  }

  /** @remarks Saves the sizes of removed items up to a limit, as a cleared filter brings them back. */
  if (sizesByKey.size > Math.max(keys.length * 2, SAVED_SIZES_LIMIT)) {
    const sizes: Map<Scroll.Key, number> = new Map()

    for (const key of keys) {
      const size: number | undefined = sizesByKey.get(key)
      if (size !== undefined) sizes.set(key, size)
    }

    cache.sizesByKey = sizes
  }

  const measuredSizes: number[] = new Array(Math.max(keys.length, cache.measuredSizes.length)).fill(
    Number.NaN
  )

  for (let index = 0; index < keys.length; index++) {
    const size: number | undefined = cache.sizesByKey.get(keys[index])
    if (size !== undefined) measuredSizes[index] = size
  }

  cache.measuredSizes = measuredSizes
  cache.elementIndexes = new WeakMap()
  rebuildTrees(cache)
}
