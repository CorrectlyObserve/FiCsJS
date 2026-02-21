import type { Scroll } from '../../types'
import { getOffsetBeforeIndex } from '../cache'
import { getAveSize, getScrollAttr, getProperty } from '../helpers'

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

export const restoreAxisOffset = <D extends object, P>({
  root,
  scrollOptions,
  isVertical,
  itemMinSize
}: {
  root: HTMLElement
  scrollOptions: Scroll.Resolved<D, P>
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
  ;(root as any)[getProperty({ isVertical, type: 'start', prefix: 'scroll' })] =
    getOffsetBeforeIndex({
      cache,
      totalCount,
      index: index ?? startIndex,
      aveSize: getAveSize({ aveSize, itemMinSize })
    }) + offset

  scrollOptions.flags.shouldRestoreAxisOffset = false
  scrollOptions.flags.isRangeLocked = false
  return true
}

export const updateFirstVisible = <D extends object, P>({
  root,
  instanceId,
  isVertical,
  scrollOptions
}: {
  root: HTMLElement
  instanceId: string
  isVertical: boolean
  scrollOptions: Scroll.Resolved<D, P>
}): void => {
  const items: HTMLElement[] = getItemsInScrollArea({ root, instanceId })
  if (items.length === 0) {
    scrollOptions.firstVisible = {}
    return
  }

  const rootRect: DOMRect = root.getBoundingClientRect(),
    viewStart: number = (rootRect as any)[getProperty({ isVertical, type: 'start' })],
    viewEnd: number = (rootRect as any)[getProperty({ isVertical, type: 'end' })]

  for (const [index, item] of items.entries()) {
    const rect: DOMRect = item.getBoundingClientRect(),
      itemStart: number = (rect as any)[getProperty({ isVertical, type: 'start' })],
      itemEnd: number = (rect as any)[getProperty({ isVertical, type: 'end' })]

    if (itemEnd <= viewStart || itemStart >= viewEnd) continue

    const keyAttr: string | null = item.getAttribute('key')
    if (!keyAttr) throw new Error('Virtual scroll items must have a unique "key" attribute...')

    scrollOptions.firstVisible.index = scrollOptions.startIndex + index
    scrollOptions.firstVisible.key = keyAttr
    scrollOptions.firstVisible.offset = itemStart - viewStart
    return
  }
}
