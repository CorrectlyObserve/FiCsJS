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
  const items: HTMLElement[] = getItemsInScrollArea({ root, instanceId })
  if (items.length === 0) {
    scrollOptions.firstVisible = {}
    return
  }

  const _getProperty = (element: HTMLElement): Record<'start' | 'end', number> => {
      const rect: DOMRectReadOnly = element.getBoundingClientRect()

      return (['start', 'end'] as const).reduce(
        (prev, curr) => {
          prev[curr] = (rect as any)[getProperty({ isVertical, type: curr })]
          return prev
        },
        {} as Record<'start' | 'end', number>
      )
    },
    { start: viewStart, end: viewEnd }: Record<'start' | 'end', number> = _getProperty(root)

  for (const [index, item] of items.entries()) {
    const { start, end }: Record<'start' | 'end', number> = _getProperty(item)

    if (end <= viewStart || start >= viewEnd) continue

    const keyAttr: string | null = item.getAttribute('key')
    if (!keyAttr) throw new Error('Virtual scroll items must have a unique "key" attribute...')

    scrollOptions.firstVisible.index = scrollOptions.startIndex + index
    scrollOptions.firstVisible.key = keyAttr
    scrollOptions.firstVisible.offset = start - viewStart
    return
  }

  scrollOptions.firstVisible = {}
}
