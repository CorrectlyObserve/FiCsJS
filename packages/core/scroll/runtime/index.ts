import { numberError, normalizeRootMargin } from '../../helpers'
import type { Scroll } from '../../types'
import { resetCache } from '../cache'
import { constants } from '../constants'
import { clearTimers, getProperty, isValidNumber } from '../helpers'
import { getRootElement, getSentinel, restoreAxisOffset, updateFirstVisible } from './dom'
import { fetchWithinThreshold, readPageParam, rebaseUrlSync, updatePageParam } from './sideEffects'
import { syncResize } from './syncResize'
import { updateAveSize, updateRange } from './virtualizer'

/**
 * @param scrollOptions.options.unit Must be a positive integer.
 * @param scrollOptions.options.itemMinSize Must be a positive number.
 * @param scrollOptions.options.bufferLength Must be a non-negative integer.
 * @param scrollOptions.options.throttleMs Must be a non-negative integer.
 * @param scrollOptions.options.thresholdRatio Must be a number between 0 and 1.
 * @param scrollOptions.totalCount Must be a non-negative integer.
 * @param scrollOptions.prevTotalCount Must be a non-negative integer.
 */
export const runInfiniteVirtualScroll = <D extends object, P extends object>({
  name,
  instanceId,
  shadowRoot,
  getDataProps,
  scrollOptions,
  reRender,
  addEventListener,
  scrollObservers,
  setScrollObservers
}: Scroll.Ctx.Runtime<D, P>): void => {
  if (!scrollOptions) return

  const { id, startIndex, totalCount, prevTotalCount }: Scroll.Resolved<D, P> = scrollOptions,
    root: HTMLElement | null = shadowRoot.getElementById(id),
    getResolvedOptions = (scrollOptions: Scroll.Resolved<D, P>): Scroll.Clamped => {
      const {
        unit,
        itemMinSize,
        bufferLength = 0,
        throttleMs = 0,
        thresholdRatio = constants.THRESHOLD_RATIO,
        ...args
      } = scrollOptions.options(getDataProps(true))

      numberError({ unit }, 'positive-int')
      numberError({ itemMinSize }, 'positive')
      numberError({ bufferLength, throttleMs }, 'non-negative-int')
      numberError({ thresholdRatio }, 'ratio')

      return { unit, itemMinSize, bufferLength, throttleMs, thresholdRatio, ...args }
    },
    deactivateRuntime = (): void => {
      if (scrollObservers) {
        for (const observer of ['intersection', 'mutation', 'resize'] as const)
          scrollObservers[observer].disconnect()

        setScrollObservers(undefined)
      }

      clearTimers(scrollOptions)
      scrollOptions.isEnabled = false
    },
    { unit, itemMinSize, axis, trigger, bufferLength }: Scroll.Clamped =
      getResolvedOptions(scrollOptions),
    isRuntimeReusable: boolean =
      root !== null && scrollOptions.isEnabled && scrollObservers?.root === root

  numberError({ totalCount, prevTotalCount }, 'non-negative-int')

  if (trigger === false) {
    if (isRuntimeReusable) {
      for (const observer of ['intersection', 'mutation', 'resize'] as const)
        scrollObservers?.[observer].disconnect()

      clearTimers(scrollOptions)

      /** @remarks Resets processing state and locks fetch until runtime is explicitly resumed. */
      scrollOptions.fetch.isFetching = false
      scrollOptions.flags.isFetchLocked = true
    } else {
      /** @remarks Fully deactivates runtime to avoid leaving a partially active state. */
      deactivateRuntime()
    }

    return
  }

  if (!root) {
    if (totalCount === 0) {
      scrollOptions.prevTotalCount = 0
      deactivateRuntime()
      return
    }

    throw new Error(`The "${id}" was not found in the shadowRoot of ${name}...`)
  }

  const getIsVertical = (): boolean => (scrollOptions.lastAxis ?? axis) === 'vertical',
    createIntersectionObserver = (rootMargin?: string | number): IntersectionObserver =>
      new IntersectionObserver(
        ([{ isIntersecting }]) => {
          if (!isIntersecting) return

          const { trigger, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions)
          if (trigger === false) return

          fetchWithinThreshold({ scrollOptions, root, isVertical: getIsVertical(), ...args })
        },
        { root, rootMargin: normalizeRootMargin(rootMargin) }
      )

  /**
   * @remarks
   * Rebases index-derived state because shrinking `totalCount` can invalidate previous indexes.
   */
  if (totalCount < prevTotalCount) {
    resetCache(scrollOptions.cache)

    const clampedIndex: number = Math.max(Math.min(startIndex, totalCount - 1), 0)
    scrollOptions.startIndex = clampedIndex
    scrollOptions.endIndex = Math.min(totalCount, clampedIndex + unit + bufferLength)

    scrollOptions.aveSize = itemMinSize
    scrollOptions.totalSize = NaN
    scrollOptions.fetch = { isFetching: false, lastTriggeredCount: 0 }
    scrollOptions.firstVisible = {}
    scrollOptions.urlSync.index = undefined
  }
  scrollOptions.prevTotalCount = totalCount

  const observers: Omit<Scroll.Observers, 'root'> =
    scrollObservers?.root === root ? scrollObservers : ({} as Omit<Scroll.Observers, 'root'>)

  if (isRuntimeReusable) {
    const { rootMargin, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions),
      isVertical: boolean = getIsVertical()

    if (observers.intersection.rootMargin !== normalizeRootMargin(rootMargin)) {
      observers.intersection.disconnect()
      observers.intersection = createIntersectionObserver(rootMargin)

      const sentinel: Element | null = getSentinel({ root, instanceId })
      if (sentinel) observers.intersection.observe(sentinel)

      setScrollObservers({ root, ...observers })
    }

    restoreAxisOffset({ scrollOptions, root, isVertical, ...args })
    syncResize({
      getScrollOptions: () => scrollOptions,
      getIsVertical,
      observers,
      root,
      instanceId,
      reRender,
      ...args
    })
    updateAveSize({ scrollOptions, ...args })
    updateRange({ scrollOptions, root, isVertical, reRender, ...args })

    const sentinel: Element | null = getSentinel({ root, instanceId })
    if (sentinel) observers.intersection.observe(sentinel)
    observers.mutation.observe(root, { childList: true, subtree: true })

    return
  }

  /** @remarks Initial setup (or full re-setup when observers cannot be reused) starts here. */
  deactivateRuntime()

  let lastSentinel: Element | null = getSentinel({ root, instanceId })
  if (!lastSentinel) return

  const { parameter, rootMargin, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions)
  let pageParam: number = readPageParam(parameter)

  rebaseUrlSync({ scrollOptions, parameter, ...args })

  if (parameter) scrollOptions.urlSync.pageParam ??= pageParam

  let lastScrolledAt: number = 0
  addEventListener({
    element: root,
    shadowRoot,
    entries: [
      [
        'scroll',
        () => {
          const { trigger, parameter, throttleMs, ...args }: Scroll.Clamped =
            getResolvedOptions(scrollOptions)
          if (trigger === false) return

          /**
           * @remarks
           * Throttles manually and dynamically to ensure consistent behavior across browsers
           * and avoid potential issues with event listeners.
           */
          const now: number = Date.now()
          if (now - lastScrolledAt < throttleMs) return
          lastScrolledAt = now

          scrollOptions.flags.hasScrolled = true
          scrollOptions.flags.isFetchLocked = false

          const isVertical: boolean = getIsVertical()
          updateFirstVisible({ scrollOptions, root, instanceId, isVertical })
          updateRange({ scrollOptions, root, isVertical, reRender, ...args })
          fetchWithinThreshold({ scrollOptions, root, isVertical, ...args })

          if (rebaseUrlSync({ scrollOptions, parameter, ...args }))
            pageParam = readPageParam(parameter)

          /** @remarks Initializes pageParam for URL sync if it doesn't already exist. */
          if (parameter) scrollOptions.urlSync.pageParam ??= pageParam

          pageParam = updatePageParam({ scrollOptions, parameter, pageParam, ...args })

          const {
            timers: { idle }
          }: Scroll.Resolved<D, P> = scrollOptions

          if (idle) clearTimeout(idle)
          scrollOptions.timers.idle = setTimeout(() => {
            const scrollAreaSize: number = (getRootElement({ root, instanceId }) as any)[
              getProperty({ isVertical: getIsVertical(), type: 'size', prefix: 'scroll' })
            ]
            numberError({ scrollAreaSize }, 'non-negative')

            const { totalSize }: Scroll.Resolved<D, P> = scrollOptions
            if (!isValidNumber(totalSize, false) || scrollAreaSize > totalSize) {
              scrollOptions.totalSize = scrollAreaSize
              reRender()
            }
          }, throttleMs)
        }
      ]
    ]
  })

  restoreAxisOffset({ scrollOptions, root, isVertical: getIsVertical(), ...args })
  syncResize({
    getScrollOptions: () => scrollOptions,
    getIsVertical,
    observers,
    root,
    instanceId,
    reRender,
    ...args
  })
  updateAveSize({ scrollOptions, ...args })
  updateRange({ scrollOptions, root, isVertical: getIsVertical(), reRender, ...args })

  observers.intersection = createIntersectionObserver(rootMargin)
  observers.mutation = new MutationObserver(() => {
    const { trigger, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions)
    if (trigger === false) return

    syncResize({
      getScrollOptions: () => scrollOptions,
      getIsVertical,
      observers,
      root,
      instanceId,
      reRender,
      ...args
    })

    const nextLastSentinel: Element | null = getSentinel({ root, instanceId })
    if (nextLastSentinel && nextLastSentinel !== lastSentinel) {
      if (lastSentinel) observers.intersection.unobserve(lastSentinel)

      observers.intersection.observe(nextLastSentinel)
      lastSentinel = nextLastSentinel
    }
  })

  observers.intersection.observe(lastSentinel)
  observers.mutation.observe(root, { childList: true, subtree: true })
  setScrollObservers({ root, ...observers })
  scrollOptions.isEnabled = true
}
