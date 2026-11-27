import type { Scroll } from '../../types'
import { estimateOffsetBeforeIndex } from '../cache'
import { OFFSET_TOLERANCE_PX } from '../constants'
import { getAveSize, getScrollAttr, getProperty, getScrollMetrics } from '../helpers'

export const getIsRtl = (root: HTMLElement, isVertical: boolean): boolean =>
  !isVertical && getComputedStyle(root).direction === 'rtl'

export const getItemsInScrollArea = ({
  root,
  instanceId
}: {
  root: HTMLElement
  instanceId: string
}): HTMLElement[] =>
  Array.from(getRootElement({ root, instanceId }).children)
    .filter((child: Element): child is HTMLElement => child instanceof HTMLElement)
    .filter((child: HTMLElement) => {
      const attr = (type: Scroll.Div): string =>
        getScrollAttr({ instanceId, type, hasValue: false })

      return !child.hasAttribute(attr('wrap')) && !child.hasAttribute(attr('sentinel'))
    })

export const getRootElement = ({
  root,
  instanceId
}: {
  root: HTMLElement
  instanceId: string
}): HTMLElement =>
  root.querySelector(`[${getScrollAttr({ instanceId, type: 'wrap', hasValue: true })}]`) ?? root

export const getSentinel = ({
  root,
  instanceId
}: {
  root: HTMLElement
  instanceId: string
}): Element | null =>
  root.querySelector(`[${getScrollAttr({ instanceId, type: 'sentinel', hasValue: true })}]`)

export const measureItemSize = ({
  item,
  nextItem,
  isVertical,
  isRtl
}: {
  item: HTMLElement
  nextItem: Element | null | undefined
  isVertical: boolean
  isRtl: boolean
}): number => {
  const { start, end }: Record<'start' | 'end', number> = measurePosition({
    element: item,
    isVertical,
    isRtl
  })

  if (nextItem) return measurePosition({ element: nextItem, isVertical, isRtl }).start - start

  return (
    end -
    start +
    (parseFloat(getComputedStyle(item)[`margin${isVertical ? 'Block' : 'Inline'}End`]) || 0)
  )
}

export const measurePosition = ({
  element,
  isVertical,
  isRtl
}: {
  element: Element
  isVertical: boolean
  isRtl: boolean
}): Record<'start' | 'end', number> => {
  const { top, bottom, left, right }: DOMRect = element.getBoundingClientRect()

  if (isVertical) return { start: top, end: bottom }
  return isRtl ? { start: -right, end: -left } : { start: left, end: right }
}

export const restoreAnchor = <D extends object, P>({
  scrollOptions,
  root,
  instanceId,
  isVertical
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  instanceId: string
  isVertical: boolean
}): void => {
  const { latest }: Scroll.Resolved<D, P>['anchors'] = scrollOptions.anchors
  if (!latest) return

  scrollOptions.anchors.latest = undefined

  const { isUnmeasurable, scrollOffset }: Scroll.Metrics = getScrollMetrics(root, isVertical)
  if (isUnmeasurable) return

  const { scrollOffset: latestScrollOffset, visibleRest = [] }: Scroll.Anchor = latest

  /** @remarks Releases the hold if the user scrolls, avoiding fighting user input. */
  if (Math.abs(scrollOffset - latestScrollOffset) > OFFSET_TOLERANCE_PX) {
    scrollOptions.anchors.pinned = undefined
    return
  }

  const items: Map<string | null, HTMLElement> = new Map(
      getItemsInScrollArea({ root, instanceId }).map(item => [item.getAttribute('key'), item])
    ),
    /** @remarks Falls back to the next visible item when the first one was removed. */
    saved: { key: string; offset: number } | undefined = [latest, ...visibleRest].find(({ key }) =>
      items.has(key)
    ),
    element: HTMLElement | undefined = saved && items.get(saved.key)

  /** @remarks Releases the hold when no saved items remain, allowing future changes to start a new one. */
  if (!saved || !element) {
    scrollOptions.anchors.pinned = undefined
    return
  }

  const isRtl: boolean = getIsRtl(root, isVertical),
    delta: number =
      measurePosition({ element, isVertical, isRtl }).start -
      measurePosition({ element: root, isVertical, isRtl }).start -
      saved.offset

  if (Math.abs(delta) < OFFSET_TOLERANCE_PX) return

  const {
    scrolling: { isPointerHeld },
    anchors: { pinned }
  }: Scroll.Resolved<D, P> = scrollOptions

  /**
   * @remarks
   * Adjusts padding instead of `scrollTop` while scrolling or dragging the thumb:
   * - Writing `scrollTop` interrupts smooth scrolling in Firefox.
   * - Browsers override `scrollTop` while the user holds the scrollbar thumb.
   * - As an exception, data changes during a scroll still update `scrollTop`,
   *   as the offset jump can exceed available padding.
   */
  if (isPointerHeld || (scrollOptions.scrolling.isActive && !pinned)) {
    if (scrollOptions.rendered.startIndex === 0) return

    const wrap: HTMLElement = getRootElement({ root, instanceId }),
      paddingProp: string = `padding-${isVertical ? 'block' : 'inline'}-start`,
      padding: number = Number.parseFloat(getComputedStyle(wrap).getPropertyValue(paddingProp)),
      /** @remarks Clamps the shift amount to the available padding to prevent large visual jumps. */
      shift: number = Math.min(delta, Math.max(padding - (scrollOptions.padding.reserve ?? 0), 0))

    wrap.style.setProperty(paddingProp, `${padding - shift}px`)
    scrollOptions.padding.shift = (scrollOptions.padding.shift ?? 0) - shift
    if (pinned) scrollOptions.padding.isReserveOff = true
    return
  }

  if (isVertical) root.scrollTop += delta
  else root.scrollLeft += isRtl ? -delta : delta

  /** @remarks Reads the offset again, as the browser may clamp the write. */
  const { scrollOffset: writtenOffset }: Scroll.Metrics = getScrollMetrics(root, isVertical)

  scrollOptions.scrolling.ownWrittenOffset = writtenOffset
  /**
   * @remarks Updates the held offset on each write, as `onScroll` clears the hold after the view leaves it.
   */
  if (pinned) pinned.scrollOffset = writtenOffset

  /**
   * @remarks Updates the range offset on each write, as the virtualizer treats any mismatch as a user scroll.
   */
  if (scrollOptions.scrolling.offsetAtRangeUpdate !== undefined)
    scrollOptions.scrolling.offsetAtRangeUpdate += writtenOffset - latestScrollOffset
}

export const restoreAxisOffset = <D extends object, P>({
  scrollOptions,
  root,
  isVertical,
  itemMinSize
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  isVertical: boolean
  itemMinSize: number
}): boolean => {
  if (!scrollOptions.flags.shouldRestoreAxisOffset) return false

  const {
    cache,
    startIndex,
    aveSize,
    totalCount,
    firstVisible: { index, offset = 0 }
  }: Scroll.Resolved<D, P> = scrollOptions

  root.scrollTop = 0
  root.scrollLeft = 0
  /** @remarks Flips the sign in RTL, as `scrollLeft` starts at 0 on the right and goes negative to the left. */
  ;(root as any)[getProperty({ isVertical, type: 'start', prefix: 'scroll' })] =
    (estimateOffsetBeforeIndex({
      cache,
      totalCount,
      index: index ?? startIndex,
      aveSize: getAveSize({ aveSize, itemMinSize })
    }) +
      offset) *
    (getIsRtl(root, isVertical) ? -1 : 1)

  scrollOptions.flags.shouldRestoreAxisOffset = false
  scrollOptions.flags.isRangeLocked = false
  return true
}

export const updateFirstVisible = <D extends object, P>({
  scrollOptions,
  root,
  instanceId,
  isVertical
}: {
  scrollOptions: Scroll.Resolved<D, P>
  root: HTMLElement
  instanceId: string
  isVertical: boolean
}): void => {
  const { isUnmeasurable, scrollOffset }: Scroll.Metrics = getScrollMetrics(root, isVertical)
  if (isUnmeasurable) return

  const items: HTMLElement[] = getItemsInScrollArea({ root, instanceId })
  if (items.length === 0) {
    scrollOptions.firstVisible = {}
    return
  }

  const isRtl: boolean = getIsRtl(root, isVertical),
    { start: viewStart, end: viewEnd }: Record<'start' | 'end', number> = measurePosition({
      element: root,
      isVertical,
      isRtl
    }),
    visibleRest: { key: string; offset: number }[] = []

  /** @remarks Uses the nearest item if none is visible, such as in a fast scroll. */
  let firstVisible:
    | { index: number; item: HTMLElement; start: number; distance: number; isVisible: boolean }
    | undefined

  for (const [index, item] of items.entries()) {
    const { start, end }: Record<'start' | 'end', number> = measurePosition({
        element: item,
        isVertical,
        isRtl
      }),
      isVisible: boolean = end > viewStart && start < viewEnd,
      distance: number = isVisible ? -1 : Math.max(viewStart - end, start - viewEnd)

    if (!firstVisible || distance < firstVisible.distance)
      firstVisible = { index, item, start, distance, isVisible }

    if (isVisible) break
  }

  if (!firstVisible) return

  if (firstVisible.isVisible)
    for (const item of items.slice(firstVisible.index + 1)) {
      const { start }: Record<'start' | 'end', number> = measurePosition({
        element: item,
        isVertical,
        isRtl
      })
      if (start >= viewEnd) break

      visibleRest.push({ key: item.getAttribute('key') ?? '', offset: start - viewStart })
    }

  const key: string | null = firstVisible.item.getAttribute('key')
  if (!key) throw new Error('Virtual scroll items must have a unique "key" attribute...')

  scrollOptions.firstVisible.index = scrollOptions.rendered.startIndex + firstVisible.index
  scrollOptions.firstVisible.key = key
  scrollOptions.firstVisible.offset = firstVisible.start - viewStart
  scrollOptions.firstVisible.scrollOffset = scrollOffset
  scrollOptions.firstVisible.isOffscreen = !firstVisible.isVisible
  scrollOptions.firstVisible.visibleRest = visibleRest
}
