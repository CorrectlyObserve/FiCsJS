import { clampRatio, numberError } from '../../helpers'
import type { Scroll } from '../../types'
import { resetCache } from '../cache'
import consts from '../constants'
import { getProperty } from '../helpers'
import { getRootElement, getSentinel, restoreAxisOffset, updateFirstVisible } from './dom'
import { fetchWithinThreshold, updatePageParam } from './sideEffects'
import syncResize from './syncResize'
import { updateAveSize, updateRange } from './virtualizer'

export default <D extends object, P>({
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

  const resolvedOptions: Scroll.Options = scrollOptions.options(getDataProps(true))
  if (resolvedOptions.trigger === false) return

  const { id }: Scroll.Resolved<D, P> = scrollOptions,
    root: HTMLElement | null = shadowRoot.getElementById(id)
  if (!root) throw new Error(`The "${id}" was not found in the shadowRoot of ${name}...`)

  const { unit, itemMinSize, bufferLength = 0, throttle } = resolvedOptions
  numberError({ unit, itemMinSize })

  const { totalCount, prevTotalCount } = scrollOptions
  numberError({ throttle, totalCount, prevTotalCount }, false)

  const { axis, parameter, rootMargin, method }: Scroll.Options = resolvedOptions,
    thresholdRate: number = clampRatio(resolvedOptions.thresholdRate ?? consts.THRESHOLD_RATE),
    getIsVertical = (): boolean => (scrollOptions.lastAxis ?? axis) === 'vertical'

  if (totalCount < prevTotalCount) {
    resetCache(scrollOptions.cache)
    scrollOptions.aveSize = itemMinSize
    scrollOptions.totalSize = NaN
  }
  scrollOptions.prevTotalCount = totalCount

  const observers: Omit<Scroll.Observers, 'root'> =
    scrollObservers?.root === root
      ? {
          intersection: scrollObservers.intersection,
          mutation: scrollObservers.mutation,
          resize: scrollObservers.resize
        }
      : ({} as Omit<Scroll.Observers, 'root'>)

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

  if (scrollObservers) {
    for (const observer of ['intersection', 'mutation', 'resize'] as const)
      scrollObservers[observer].disconnect()

    setScrollObservers(undefined)
    scrollOptions.isEnabled = false
  }

  let lastSentinel: Element | null = getSentinel({ root, instanceId })
  if (!lastSentinel) return

  let pageParam: number = 1
  if (parameter) {
    const rawPageParam: string | null = new URL(window.location.href).searchParams.get(parameter)

    if (rawPageParam !== null) {
      const nextPageParam: number = Number(rawPageParam)
      numberError({ nextPageParam })
      pageParam = nextPageParam
    }
  }

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

  observers.intersection = new IntersectionObserver(
    ([{ isIntersecting }]) => {
      if (!isIntersecting) return
      fetchWithinThreshold({
        scrollOptions,
        root,
        isVertical: getIsVertical(),
        itemMinSize,
        bufferLength,
        method
      })
    },
    { root, rootMargin: typeof rootMargin === 'number' ? `${rootMargin}px` : rootMargin }
  )
  observers.mutation = new MutationObserver(() => {
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
