import { numberError } from '../../helpers'
import type { Scroll } from '../../types'
import { getOffsetBeforeIndex, rebuildFenwickTrees } from '../cache'
import consts from '../constants'
import { fenwickTree, getAveSize, getScrollMetrics, isValidNumber } from '../helpers'

export const updateAveSize = <D extends object, P>({
  scrollOptions,
  itemMinSize,
  thresholdRatio
}: {
  scrollOptions: Scroll.Resolved<D, P>
  itemMinSize: number
  thresholdRatio: number
}): boolean => {
  const { cache, aveSize, totalCount }: Scroll.Resolved<D, P> = scrollOptions,
    { startIndex, maxLength, sizeFenwickTree, countFenwickTree } = cache,
    prevAveSize: number = getAveSize({ aveSize: aveSize, itemMinSize })

  rebuildFenwickTrees(cache, 'if-needed')
  const cacheLength: number = Math.max(Math.min(maxLength, totalCount - startIndex), 0),
    measuredSize: number = fenwickTree.sum(sizeFenwickTree, cacheLength),
    measuredCount: number = fenwickTree.sum(countFenwickTree, cacheLength)

  if (measuredCount === 0) {
    scrollOptions.aveSize = prevAveSize
    return false
  }

  const measuredAve: number = Math.max(itemMinSize, measuredSize / measuredCount),
    delta: number = measuredAve - prevAveSize,
    threshold: number = prevAveSize * thresholdRatio

  if (Math.abs(delta) < threshold) return false

  scrollOptions.aveSize = prevAveSize + delta * consts.SMOOTHING_FACTOR
  return true
}

/** @param scrollOptions.totalCount Must be a non-negative integer. */
export const updateRange = <D extends object, P>({
  scrollOptions,
  root,
  isVertical,
  itemMinSize,
  unit,
  bufferLength,
  reRender
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  isVertical: boolean
  itemMinSize: number
  unit: number
  bufferLength: number
  reRender: Scroll.Ctx.Runtime<D, P>['reRender']
}): void => {
  const {
    cache,
    startIndex,
    endIndex,
    totalCount,
    flags: { isRangeLocked }
  }: Scroll.Resolved<D, P> = scrollOptions

  numberError({ totalCount }, 'non-negative-int')
  if (totalCount === 0) return

  if (isRangeLocked) {
    scrollOptions.flags.isRangeLocked = false
    return
  }

  let { totalSize }: Scroll.Resolved<D, P> = scrollOptions
  if (!isValidNumber(totalSize)) totalSize = 0

  const { scrollOffset, clientSize }: Scroll.Metrics = getScrollMetrics(root, isVertical),
    estimatedAveSize: number = getAveSize({ aveSize: scrollOptions.aveSize, itemMinSize }),
    _getOffsetBeforeIndex = (index: number): number =>
      getOffsetBeforeIndex({ cache, totalCount, index, aveSize: estimatedAveSize })

  const visibleCount: number = Math.ceil(clientSize / estimatedAveSize),
    renderedCount: number = Math.max(visibleCount, unit) + bufferLength,
    nextStartIndex: number = (() => {
      let correct: number = 0
      if (scrollOffset <= 0) return correct

      /**
       * @remarks
       * Binary-searches the items to find the first visible index based on scroll offset.
       * Time complexity: O(log N)
       */
      let low: number = 0
      let high: number = totalCount

      while (low < high) {
        const mid: number = Math.floor((low + high) / 2)

        if (_getOffsetBeforeIndex(mid) <= scrollOffset) {
          correct = mid
          low = mid + 1
        } else high = mid
      }

      /** @remarks 0-based index */
      const startIndex: number = correct - Math.floor(bufferLength / 2),
        maxStartIndex: number = totalCount - 1

      if (startIndex > maxStartIndex) return maxStartIndex
      if (startIndex < 0) return 0
      return startIndex
    })(),
    nextEndIndex: number = Math.min(nextStartIndex + renderedCount, totalCount),
    estimatedTotalSize = (() => {
      const maxTotalSize: number = _getOffsetBeforeIndex(totalCount)

      let scrollWidth: number = 0
      if (!isVertical) {
        const { scrollWidth: _scrollWidth }: { scrollWidth: number } = root
        if (Number.isFinite(_scrollWidth) && _scrollWidth > 0) scrollWidth = _scrollWidth
      }

      return Math.max(estimatedAveSize * totalCount, maxTotalSize, scrollWidth)
    })(),
    nextTotalSize = Math.max(estimatedTotalSize, totalSize)

  const hasRangeChanged: boolean = nextStartIndex !== startIndex || nextEndIndex !== endIndex,
    hasSizeChanged: boolean = Math.abs(totalSize - nextTotalSize) >= consts.SIZE_DELTA_TOLERANCE_PX

  if (hasRangeChanged || hasSizeChanged) {
    scrollOptions.startIndex = nextStartIndex
    scrollOptions.endIndex = nextEndIndex
    scrollOptions.totalSize = nextTotalSize
    reRender()
  }
}
