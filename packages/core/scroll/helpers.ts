import type { Scroll } from '../types'
import fenwickTree from './fenwickTree'

export const getScrollAttr = ({
  instanceId,
  type,
  hasValue
}: {
  instanceId: string
  type: Scroll.Div
  hasValue: boolean
}): string => `${instanceId}-${type}${hasValue ? '="true"' : ''}`

export const rebuildFenwickTrees = (cache: Scroll.Cache): void => {
  const max: number = Math.max(cache.max, 1)
  cache.sizeFenwickTree = fenwickTree.reset(max)
  cache.countedFenwickTree = fenwickTree.reset(max)

  const { indexSizes, start, sizeFenwickTree, countedFenwickTree }: Scroll.Cache = cache

  for (const [index, size] of indexSizes) {
    /**
      @remarks
      Fenwick trees are 1-indexed, so we add 1 to shift to the tree index and reserve index 0.
    */
    const relativeIndex: number = index - start,
      treeIndex: number = relativeIndex + 1

    if (treeIndex < 1 || treeIndex > max) continue

    fenwickTree.add(sizeFenwickTree, treeIndex, size)
    fenwickTree.add(countedFenwickTree, treeIndex, 1)
  }
}

export const ensureFenwickTrees = (cache: Scroll.Cache): void => {
  /**
    @remarks
    Fenwick trees are 1-indexed, so the backing arrays are sized as max + 1 to reserve index 0.
  */
  const { max, sizeFenwickTree, countedFenwickTree }: Scroll.Cache = cache,
    cacheLength: number = Math.max(max, 1) + 1

  if (sizeFenwickTree.length === cacheLength && countedFenwickTree.length === cacheLength) return

  rebuildFenwickTrees(cache)
}
