import { clampRatio, numberError } from '../../helpers'
import type { Scroll } from '../../types'
import { resetCache } from '../cache'
import consts from '../constants'
import { clearTimers, getProperty, isValidNumber, normalizeRootMargin } from '../helpers'
import { getRootElement, getSentinel, restoreAxisOffset, updateFirstVisible } from './dom'
import { fetchWithinThreshold, readPageParam, rebaseUrlSync, updatePageParam } from './sideEffects'
import syncResize from './syncResize'
import { updateAveSize, updateRange } from './virtualizer'

const runInfiniteVirtualScroll = <D extends object, P extends object>({
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
        throttle = 0,
        thresholdRate = consts.THRESHOLD_RATE,
        ...args
      } = scrollOptions.options(getDataProps(true))

      numberError({ unit, itemMinSize })
      numberError({ bufferLength, throttle }, false)

      return {
        unit,
        itemMinSize,
        bufferLength,
        throttle,
        thresholdRate: clampRatio(thresholdRate),
        ...args
      }
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
      getResolvedOptions(scrollOptions)

  numberError({ totalCount, prevTotalCount }, false)

  if (trigger === false) {
    if (root && scrollObservers?.root === root && scrollOptions.isEnabled) {
      for (const observer of ['intersection', 'mutation', 'resize'] as const)
        scrollObservers[observer].disconnect()

      clearTimers(scrollOptions)
      scrollOptions.fetch.isFetching = false
      scrollOptions.flags.isFetchLocked = true
    } else deactivateRuntime()

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
    createIntersectionObserver = (rootMargin: string | number | undefined): IntersectionObserver =>
      new IntersectionObserver(
        ([{ isIntersecting }]) => {
          if (!isIntersecting) return

          const { trigger, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions)
          if (trigger === false) return

          fetchWithinThreshold({ scrollOptions, root, isVertical: getIsVertical(), ...args })
        },
        { root, rootMargin: normalizeRootMargin(rootMargin) }
      )

  let lastScrollHandledAt: number = 0

  if (totalCount < prevTotalCount) {
    resetCache(scrollOptions.cache)
    scrollOptions.aveSize = itemMinSize
    scrollOptions.totalSize = NaN
  }
  scrollOptions.prevTotalCount = totalCount

  const observers: Omit<Scroll.Observers, 'root'> =
    scrollObservers?.root === root ? scrollObservers : ({} as Omit<Scroll.Observers, 'root'>)

  if (scrollOptions.isEnabled && scrollObservers?.root === root) {
    const isVertical: boolean = getIsVertical()

    if (restoreAxisOffset({ root, scrollOptions, isVertical, itemMinSize })) {
      syncResize({
        getScrollOptions: () => scrollOptions,
        getIsVertical,
        observers,
        root,
        instanceId,
        unit,
        itemMinSize,
        bufferLength,
        thresholdRate,
        reRender
      })
      updateAveSize({ scrollOptions, itemMinSize, thresholdRate })
      updateRange({
        scrollOptions,
        root,
        isVertical,
        itemMinSize,
        unit,
        bufferLength,
        reRender
      })
    }

    return
  }

  /**
   * @remarks
   * Initial setup (or full re-setup when observers cannot be reused) starts here.
   */
  deactivateRuntime()

  let lastSentinel: Element | null = getSentinel({ root, instanceId })
  if (!lastSentinel) return

  const { parameter, rootMargin, ...args }: Scroll.Clamped = getResolvedOptions(scrollOptions)
  let pageParam: number = readPageParam(parameter)

  rebaseUrlSync({ scrollOptions, parameter, ...args })

  if (parameter && scrollOptions.urlSync.pageParam === undefined)
    scrollOptions.urlSync.pageParam = pageParam

  addEventListener({
    element: root,
    shadowRoot,
    entries: [
      [
        'scroll',
        [
          () => {
            const isVertical: boolean = getIsVertical()

            scrollOptions.flags.hasScrolled = true
            scrollOptions.flags.isFetchLocked = false

            updateFirstVisible({ root, instanceId, isVertical, scrollOptions })
            updateRange({
              scrollOptions,
              root,
              isVertical,
              itemMinSize,
              unit,
              bufferLength,
              reRender
            })
            fetchWithinThreshold({
              scrollOptions,
              root,
              isVertical,
              itemMinSize,
              bufferLength,
              method
            })
            pageParam = updatePageParam({ parameter, scrollOptions, pageParam, unit })

            const {
              timers: { idle }
            }: Scroll.Resolved<D, P> = scrollOptions

            if (idle) clearTimeout(idle)
            scrollOptions.timers.idle = setTimeout(() => {
              const scrollAreaSize: number = (getRootElement({ root, instanceId }) as any)[
                getProperty({ isVertical: getIsVertical(), type: 'size', prefix: 'scroll' })
              ]
              numberError({ scrollAreaSize })

              const { totalSize }: Scroll.Resolved<D, P> = scrollOptions
              if (scrollAreaSize > (Number.isFinite(totalSize) ? totalSize : 0)) {
                scrollOptions.totalSize = scrollAreaSize
                reRender()
              }
            }, throttle ?? 0)
          },
          { throttle }
        ]
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

export default runInfiniteVirtualScroll
