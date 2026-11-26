import { isBrowser, numberError } from '../helpers'
import type { Html, Scroll } from '../types'
import { estimateOffsetBeforeIndex, resetCache, syncCache } from './cache'
import { MAX_ELEMENT_SIZE_PX } from './constants'
import {
  clearTimers,
  getAnchor,
  getAveSize,
  getProperty,
  getScrollAttr,
  isValidNumber
} from './helpers'

const compareRenderedItems = <D extends object, P>(
  keys: readonly Scroll.Key[],
  { rendered: { items, startIndex } }: Scroll.Resolved<D, P>
): { isChanged: boolean; delta: number } => {
  if (!items) return { isChanged: false, delta: 0 }

  const { first, last, length } = items
  if (keys[startIndex] === first && keys[startIndex + length - 1] === last)
    return { isChanged: false, delta: 0 }

  const nextStart: number = keys.indexOf(first)

  if (nextStart >= 0)
    return {
      isChanged: true,
      delta: keys[nextStart + length - 1] === last ? nextStart - startIndex : 0
    }

  const nextLast: number = keys.indexOf(last)
  return {
    isChanged: true,
    /** @remarks Keeps startIndex + delta at 0 or more, as the caller adds delta to startIndex. */
    delta: nextLast >= 0 ? Math.max(nextLast - (startIndex + length - 1), -startIndex) : 0
  }
}

/**
 * @param scrollOptions.options.unit Must be a positive integer.
 * @param scrollOptions.options.itemMinSize Must be a positive number.
 * @param scrollOptions.options.bufferLength Must be a non-negative integer.
 * @param scrollOptions.startIndex Must be a non-negative integer.
 * @param scrollOptions.endIndex Must be a non-negative integer.
 */
export const scrollTemplate = <D extends object, P extends object, T>({
  instanceId,
  getDataProps,
  template,
  scrollOptions,
  array,
  callback
}: Scroll.Ctx.Template<D, P, T>): Html.Sanitized<D, P> => {
  if (!array || array.length === 0) {
    if (scrollOptions) {
      scrollOptions.startIndex = 0
      scrollOptions.endIndex = 0
      scrollOptions.rendered.startIndex = 0
      scrollOptions.rendered.items = undefined
      scrollOptions.totalSize = NaN
      scrollOptions.totalCount = 0
      scrollOptions.flags = {
        hasScrolled: false,
        isRangeLocked: false,
        isJustReset: true,
        shouldRestoreAxisOffset: false,
        hasWarnedMaxSize: false,
        hasKeyWarned: false
      }
      scrollOptions.fetch.lastTriggeredCount = 0
      scrollOptions.firstVisible = {}
      scrollOptions.padding.shift = scrollOptions.padding.min = 0
      scrollOptions.padding.isMinOff = false
      /** @remarks Prevents negative index deltas after list reset. */
      scrollOptions.urlSync.index = undefined

      resetCache(scrollOptions.cache)
      clearTimers(scrollOptions)
    }

    return template`${[]}`
  }

  if (!scrollOptions) return template`${array.map((item, index) => callback(item, index))}`

  const totalCount: number = array.length,
    { cache, options, id, aveSize: storedAveSize, lastAxis }: Scroll.Resolved<D, P> = scrollOptions,
    { unit, itemMinSize, axis, bufferLength, getKey }: Scroll.Options = options(getDataProps(true))

  syncCache({ cache: cache, items: array, getKey })

  const { keys }: Scroll.Cache = cache,
    { isChanged, delta }: { isChanged: boolean; delta: number } = compareRenderedItems(
      keys,
      scrollOptions
    )

  if (delta !== 0) {
    const { startIndex, endIndex, firstVisible, urlSync }: Scroll.Resolved<D, P> = scrollOptions

    scrollOptions.startIndex = Math.max(startIndex + delta, 0)
    scrollOptions.endIndex = Math.max(endIndex + delta, 0)
    if (firstVisible.index !== undefined) firstVisible.index += delta
    if (urlSync.index !== undefined) urlSync.index += delta
  }

  const anchor: Scroll.Anchor | undefined = getAnchor(scrollOptions)
  if (isChanged && anchor) scrollOptions.anchors.pinned ??= anchor

  const { pinned }: Scroll.Resolved<D, P>['anchors'] = scrollOptions.anchors
  scrollOptions.anchors.latest =
    pinned && anchor ? { ...pinned, scrollOffset: anchor.scrollOffset } : anchor

  numberError({ unit }, 'positive-int')
  numberError({ itemMinSize }, 'positive')
  numberError({ bufferLength }, 'non-negative-int')

  /** @remarks Resets the item min size. */
  if (!isValidNumber(storedAveSize) || storedAveSize < itemMinSize)
    scrollOptions.aveSize = itemMinSize

  if (lastAxis !== undefined && lastAxis !== axis) {
    const { cache, startIndex, firstVisible }: Scroll.Resolved<D, P> = scrollOptions
    numberError({ startIndex }, 'non-negative-int')

    resetCache(cache)
    const clampedIndex: number = Math.min(startIndex, totalCount - 1)
    scrollOptions.startIndex = clampedIndex
    scrollOptions.endIndex = Math.min(totalCount, clampedIndex + unit + (bufferLength ?? 0))
    scrollOptions.aveSize = itemMinSize
    scrollOptions.totalSize = NaN
    scrollOptions.flags = {
      hasScrolled: false,
      isRangeLocked: true,
      isJustReset: true,
      shouldRestoreAxisOffset: true,
      hasWarnedMaxSize: false,
      hasKeyWarned: false
    }
    scrollOptions.fetch.lastTriggeredCount = 0
    firstVisible.offset = 0
    scrollOptions.anchors.latest = scrollOptions.anchors.pinned = undefined
    scrollOptions.padding.shift = 0
    clearTimers(scrollOptions)
  }

  const { cache, startIndex, endIndex, totalSize, aveSize }: Scroll.Resolved<D, P> = scrollOptions
  numberError({ startIndex, endIndex }, 'non-negative-int')

  /**
   * @remarks
   * Recalculates the `end` index to handle operations such as sorting or data updates.
   */
  if (endIndex <= startIndex)
    scrollOptions.endIndex = Math.min(totalCount, startIndex + unit + (bufferLength ?? 0))

  const resolvedAveSize: number = getAveSize({ aveSize, itemMinSize }),
    estimatedTotalSize: number = resolvedAveSize * totalCount

  let nextTotalSize: number = estimatedTotalSize
  if (Number.isFinite(totalSize)) nextTotalSize = Math.max(totalSize, estimatedTotalSize)

  /**
   * @remarks
   * Simulates the height of unrendered items to keep the current scroll position.
   */
  const isVertical: boolean = axis === 'vertical',
    sizeProp: string = getProperty({ isVertical, type: 'size' }),
    styles = {
      container: [
        'position:relative;overscroll-behavior:contain;overflow-anchor:none;',
        `${sizeProp}:${itemMinSize * unit}px;`,
        `overflow-${isVertical ? 'y' : 'x'}:auto;overflow-${isVertical ? 'x' : 'y'}:hidden;`,
        isVertical ? '' : 'margin-inline:auto;'
      ].join(''),
      wrap: [
        'box-sizing:border-box;position:relative;',
        `min-${sizeProp}:${nextTotalSize}px;`,
        isVertical ? 'display:block;' : 'display:flex;flex-wrap:nowrap;align-items:flex-start;',
        `padding-${isVertical ? 'block' : 'inline'}-start:${estimatedPadding + scrollOptions.padding.shift}px;`
      ].join(''),
      sentinel: [
        'position:absolute;height:1px;width:1px;',
        `${isVertical ? 'left' : 'top'}:0;`,
        `${isVertical ? 'top' : 'inset-inline-start'}:${Math.max(nextTotalSize - 1, 0)}px;`
      ].join('')
    } as const,
    div = (type: Scroll.Div, contents?: Html.Sanitized<D, P>[]): Html.Sanitized<D, P> => template`
      <div ${getScrollAttr({ instanceId, type, hasValue: true })} key="${id}-${type}" style="${styles[type]}">
        ${contents ?? ''}
      </div>
    `

  scrollOptions.totalSize = nextTotalSize
  scrollOptions.totalCount = totalCount
  scrollOptions.lastAxis = axis

  return template`
    <div id="${id}" style="${styles.container}">
      ${div(
        'wrap',
        array
          .slice(startIndex, Math.min(endIndex, totalCount))
          .map((item, index) => callback(item, index + startIndex))
      )}
      ${div('sentinel')}
    </div>
  `
}
