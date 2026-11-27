import type { Scroll } from '../../types'
import { getAveSize, getScrollMetrics } from '../helpers'

export const fetchWithinThreshold = <D extends object, P>({
  scrollOptions,
  root,
  isVertical,
  itemMinSize,
  bufferLength,
  method,
  onError
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  isVertical: boolean
  itemMinSize: number
  bufferLength: number
  method: () => void
  onError?: (error: unknown) => void
}): void => {
  const {
    aveSize,
    listLength,
    flags: { isJustReset, hasScrolled },
    fetch: { isFetching, lastTriggeredCount }
  }: Scroll.Resolved<D, P> = scrollOptions

  if (isFetching || listLength <= lastTriggeredCount) return

  const { scrollOffset, scrollAmount, clientSize, isUnmeasurable }: Scroll.Metrics =
    getScrollMetrics(root, isVertical)

  if (isUnmeasurable) return

  if (scrollAmount > clientSize) {
    /** @remarks Ignores `isJustReset` on a short list, as only a scroll clears it and this list cannot scroll. */
    if (isJustReset) return

    if (!hasScrolled && scrollOffset === 0) return

    /** @remarks The remaining distance in pixels to the end of the scrollable content. */
    const distance: number = scrollAmount - (scrollOffset + clientSize),
      threshold: number = getAveSize({ aveSize, itemMinSize }) * bufferLength
    if (distance > threshold) return
  }

  scrollOptions.fetch = { isFetching: true, lastTriggeredCount: listLength }
  Promise.resolve()
    .then(method)
    .catch(error => {
      /** @remarks Rolls back only if no reset changed the count meanwhile, as it would bring back the old count. */
      const isUnchanged: boolean = scrollOptions.fetch.lastTriggeredCount === listLength
      if (isUnchanged) scrollOptions.fetch.lastTriggeredCount = lastTriggeredCount

      try {
        onError?.(error)
      } finally {
        console.error(`Infinite virtual scroll fetch failed due to: ${error}...`)
      }
    })
    .finally(() => (scrollOptions.fetch.isFetching = false))
}

export const readPageParam = (parameter?: string): number => {
  const rawParam: string | null = parameter
    ? new URL(window.location.href).searchParams.get(parameter)
    : null

  if (rawParam === null) return 1

  /** @remarks Falls back to page 1, as anyone can type a bad value into the URL. */
  const param: number = Number(rawParam)
  return Number.isInteger(param) && param > 0 ? param : 1
}

export const rebaseUrlSync = <D extends object, P>({
  scrollOptions,
  parameter,
  unit
}: {
  scrollOptions: Scroll.Resolved<D, P>
  parameter: string | undefined
  unit: number
}): boolean => {
  const {
    urlSync: { parameter: urlParameter, unit: urlUnit }
  }: Scroll.Resolved<D, P> = scrollOptions

  if (urlParameter === parameter && urlUnit === unit) return false

  scrollOptions.urlSync.index = undefined
  scrollOptions.urlSync.pageParam = undefined
  scrollOptions.urlSync.parameter = parameter
  scrollOptions.urlSync.unit = unit
  return true
}

export const updatePageParam = <D extends object, P>({
  scrollOptions,
  parameter,
  pageParam,
  unit
}: {
  scrollOptions: Scroll.Resolved<D, P>
  parameter: string | undefined
  pageParam: number
  unit: number
}): number => {
  if (!parameter || !scrollOptions.flags.hasScrolled) return pageParam

  const {
      startIndex,
      firstVisible: { index, isOffscreen }
    }: Scroll.Resolved<D, P> = scrollOptions,
    /** @remarks Uses startIndex if no item was measured or it is offscreen, as an offscreen item is from the old position. */
    nextStartIndex: number = index === undefined || isOffscreen ? startIndex : index

  scrollOptions.urlSync.index ??= nextStartIndex
  scrollOptions.urlSync.pageParam ??= pageParam

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
