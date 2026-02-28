import { numberError } from '../helpers'
import type { Scroll } from '../types'
import { fenwickTree } from './helpers'

export const evictCache = <D extends object, P>({
  cache,
  index
}: {
  cache: Scroll.Cache
  index: number
}): void => {
  const { indexKeys, startIndex, maxLength, sizeFenwickTree, countFenwickTree }: Scroll.Cache =
    cache

  numberError({ maxLength })
  numberError({ index }, 'non-negative')

  /**
   * @remarks
   * Resets the cache when scrolling moves toward earlier indexes.
   */
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

export const getOffsetBeforeIndex = <D extends object, P>({
  cache,
  totalCount,
  index,
  aveSize
}: Scroll.Ctx.OffsetBeforeIndex): number => {
  numberError({ index }, 'non-negative')
  numberError({ aveSize })

  if (!cache) return index * aveSize

  rebuildFenwickTrees(cache, 'if-needed')

  const {
    startIndex,
    maxLength,
    evictedSize,
    evictedCount,
    sizeFenwickTree,
    countFenwickTree
  }: Scroll.Cache = cache

  numberError({ evictedSize, evictedCount }, 'non-negative')

  /**
   * @remarks
   * The estimated cumulative size before the current index.
   * Starts with the evicted measured total size and adds an average-size fallback
   * for evicted items without measured sizes.
   */
  let estimatedSize: number = evictedSize + (startIndex - evictedCount) * aveSize,
    estimatedAveSize: number = startIndex > 0 ? estimatedSize / startIndex : aveSize

  if (index <= startIndex) return estimatedAveSize * index

  numberError({ maxLength, totalCount })

  const endIndex: number = Math.min(startIndex + maxLength, totalCount),
    clampedIndex: number = Math.min(index, totalCount),
    measurableEndIndex: number = Math.min(clampedIndex, endIndex)

  /**
   * @remarks
   * The relative index within the cache window.
   * Converts the global list index into a relative cache position (0 to maxLength).
   */
  let relativeIndex = measurableEndIndex - startIndex

  numberError({ relativeIndex })

  if (relativeIndex > 0) {
    const measuredSize: number = fenwickTree.sum(sizeFenwickTree, relativeIndex),
      measuredCount: number = fenwickTree.sum(countFenwickTree, relativeIndex)

    estimatedSize += measuredSize + (relativeIndex - measuredCount) * aveSize
  } else estimatedSize += relativeIndex * aveSize

  /**
   * @remarks
   * Adds the estimated size for items located beyond the current cache window by using the average.
   *
   * @example
   * `endIndex` = 100, `clampedIndex` = 150, `aveSize` = 50
   * Added size: (150 - 100) * 50 = 2500
   */
  if (clampedIndex > endIndex) estimatedSize += (clampedIndex - endIndex) * aveSize

  numberError({ estimatedSize })
  return estimatedSize
}

export const rebuildFenwickTrees = (cache: Scroll.Cache, mode: 'force' | 'if-needed'): void => {
  const { maxLength }: Scroll.Cache = cache
  numberError({ maxLength })

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

export const resetCache = <D extends object, P>(cache: Scroll.Cache): void => {
  for (const map of ['elementSizes', 'indexSizes', 'indexKeys'] as const) cache[map].clear()

  for (const number of ['startIndex', 'evictedSize', 'evictedCount'] as const) cache[number] = 0

  cache.elementIndexes = new WeakMap()
  rebuildFenwickTrees(cache, 'force')
}
