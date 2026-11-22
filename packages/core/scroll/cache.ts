import { numberError } from '../helpers'
import type { Scroll } from '../types'
import { FIXED_POINT_SCALE } from './constants'
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
 * @param cache Must be a positive integer.
 * @param index Must be a non-negative integer.
 */
export const evictCache = <D extends object, P>({
  cache,
  index
}: {
  cache: Scroll.Cache
  index: number
}): void => {
  const { indexKeys, startIndex, maxLength, sizeFenwickTree, countFenwickTree }: Scroll.Cache =
    cache

  numberError({ maxLength }, 'positive-int')
  numberError({ index }, 'non-negative-int')

  /** @remarks Resets the cache when scrolling moves toward earlier indexes. */
  if (index < startIndex) {
    cache.startIndex = index
    cache.evictedSize = 0
    cache.evictedCount = 0
    rebuildFenwickTrees(cache, 'force')
    return
  }
  if (index === startIndex) return

  rebuildFenwickTrees(cache, 'if-needed')

  let evictedCount: number = index - startIndex
  if (evictedCount > maxLength) evictedCount = maxLength

  cache.evictedSize += fenwickTree.sum(sizeFenwickTree, evictedCount)
  cache.evictedCount += fenwickTree.sum(countFenwickTree, evictedCount)

  for (const [_index, key] of indexKeys) {
    if (_index >= index) continue

    cache.indexSizes.delete(_index)
    cache.indexKeys.delete(_index)
    if (key) cache.elementSizes.delete(key)
  }

  cache.startIndex = index
  rebuildFenwickTrees(cache, 'force')
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

/** @param cache.maxLength Must be a positive integer. */
export const rebuildFenwickTrees = (cache: Scroll.Cache, mode: 'force' | 'if-needed'): void => {
  const { maxLength }: Scroll.Cache = cache
  numberError({ maxLength }, 'positive-int')

  if (mode === 'if-needed') {
    const { sizeFenwickTree, countFenwickTree }: Scroll.Cache = cache

    /**
     * @remarks
     * Converts the 0-based relative index to 1-based, as required by the Fenwick Tree.
     */
    const cacheLength: number = maxLength + 1
    if (sizeFenwickTree.length === cacheLength && countFenwickTree.length === cacheLength) return
  }

  cache.sizeFenwickTree = fenwickTree.reset(maxLength)
  cache.countFenwickTree = fenwickTree.reset(maxLength)

  const { indexSizes, startIndex, sizeFenwickTree, countFenwickTree }: Scroll.Cache = cache

  for (const [index, size] of indexSizes) {
    /**
     * @remarks
     * Converts the 0-based relative index to 1-based, as required by the Fenwick Tree.
     */
    const treeIndex: number = index - startIndex + 1

    if (treeIndex < 1 || treeIndex > maxLength) continue

    fenwickTree.add(sizeFenwickTree, treeIndex, size)
    fenwickTree.add(countFenwickTree, treeIndex, 1)
  }
}

export const resetCache = (cache: Scroll.Cache): void => {
  cache.measuredSizes.fill(Number.NaN)
  cache.renderedKeys.clear()
  cache.elementIndexes = new WeakMap()
  rebuildTrees(cache)
}
