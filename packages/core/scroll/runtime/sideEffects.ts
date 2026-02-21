import type { Scroll } from '../../types'
import { getAveSize, getScrollMetrics } from '../helpers'

export const fetchWithinThreshold = <D extends object, P>({
  scrollOptions,
  root,
  isVertical,
  itemMinSize,
  bufferLength,
  method
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  isVertical: boolean
  itemMinSize: number
  bufferLength: number
  method: () => void
}): void => {
  const {
    aveSize,
    totalCount,
    flags: { isFetchLocked, hasScrolled },
    fetch: { isFetching, lastTriggeredCount }
  }: Scroll.Resolved<D, P> = scrollOptions

  if (isFetchLocked || isFetching || totalCount <= lastTriggeredCount) return

  const { scrollOffset, scrollAmount, clientSize }: Scroll.Metrics = getScrollMetrics(
    root,
    isVertical
  )
  if (scrollAmount > clientSize) {
    if (!hasScrolled && scrollOffset === 0) return

    /**
     * @remarks
     *
     */
    const distance: number = scrollAmount - (scrollOffset + clientSize),
      threshold: number = getAveSize({ aveSize, itemMinSize }) * bufferLength
    if (distance > threshold) return
  }

  scrollOptions.fetch = { isFetching: true, lastTriggeredCount: totalCount }
  Promise.resolve()
    .then(method)
    .catch(error => {
      /**
       * @remarks
       * Resets `lastTriggeredCount` on failure to allow retries.
       */
      scrollOptions.fetch.lastTriggeredCount = lastTriggeredCount
      console.error(`Infinite virtual scroll fetch failed due to: ${error}...`)
    })
    .finally(() => (scrollOptions.fetch.isFetching = false))
}

export const updatePageParam = <D extends object, P>({
  parameter,
  scrollOptions,
  pageParam,
  unit
}: {
  parameter: string | undefined
  scrollOptions: Scroll.Resolved<D, P>
  pageParam: number
  unit: number
}): number => {
  if (!parameter || !scrollOptions.flags.hasScrolled) return pageParam

  const {
      startIndex,
      firstVisible: { index }
    }: Scroll.Resolved<D, P> = scrollOptions,
    nextStartIndex = index ?? startIndex

  if (scrollOptions.urlSync.index === undefined) scrollOptions.urlSync.index = nextStartIndex

  if (scrollOptions.urlSync.pageParam === undefined) scrollOptions.urlSync.pageParam = pageParam

  const {
      urlSync: { index: _index, pageParam: _pageParam }
    } = scrollOptions,
    deltaIndex: number = nextStartIndex - _index,
    nextPage: number = Math.max(_pageParam + Math.floor(deltaIndex / unit), 1)

  if (pageParam === nextPage) return pageParam

  const url: URL = new URL(window.location.href)
  if (nextPage <= 1) url.searchParams.delete(parameter)
  else url.searchParams.set(parameter, nextPage.toString())

  window.history.replaceState(null, '', url.toString())
  return nextPage
}
