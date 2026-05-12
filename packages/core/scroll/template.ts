import { joinArray, numberError } from '../helpers'
import type { Html, Scroll } from '../types'
import { getOffsetBeforeIndex, resetCache } from './cache'
import { clearTimers, getAveSize, getScrollAttr, getProperty, isValidNumber } from './helpers'

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
      scrollOptions.totalSize = NaN
      scrollOptions.totalCount = 0
      scrollOptions.flags = {
        hasScrolled: false,
        isRangeLocked: false,
        isFetchLocked: true,
        shouldRestoreAxisOffset: false
      }
      scrollOptions.fetch = { isFetching: false, lastTriggeredCount: 0 }
      scrollOptions.firstVisible = {}
      /** @remarks Prevents negative index deltas after list reset. */
      scrollOptions.urlSync.index = undefined

      clearTimers(scrollOptions)
    }

    return template`${[]}`
  }

  if (!scrollOptions) return template`${array.map((item, index) => callback(item, index))}`

  const totalCount: number = array.length,
    { options, id, aveSize: storedAveSize, lastAxis }: Scroll.Resolved<D, P> = scrollOptions,
    { unit, itemMinSize, axis, bufferLength }: Scroll.Options = options(getDataProps(true))

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
      isFetchLocked: true,
      shouldRestoreAxisOffset: true
    }
    scrollOptions.fetch = { isFetching: false, lastTriggeredCount: 0 }
    firstVisible.offset = 0
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
  const offsetPadding: number = Math.min(
      getOffsetBeforeIndex({ cache, totalCount, index: startIndex, aveSize: resolvedAveSize }),
      nextTotalSize
    ),
    isVertical: boolean = axis === 'vertical',
    sizeProp: string = getProperty({ isVertical, type: 'size' }),
    startProp: string = getProperty({ isVertical, type: 'start' }),
    styles = {
      container: joinArray([
        'position:relative;overscroll-behavior:contain;',
        `${sizeProp}:${itemMinSize * unit}px;`,
        `overflow-${isVertical ? 'y' : 'x'}:auto;overflow-${isVertical ? 'x' : 'y'}:hidden;`,
        isVertical ? '' : 'margin-inline:auto;'
      ]),
      wrap: joinArray([
        'box-sizing:border-box;position:relative;',
        `min-${sizeProp}:${nextTotalSize}px;`,
        isVertical ? 'display:block;' : 'display:flex;flex-wrap:nowrap;align-items:flex-start;',
        `padding-${startProp}:${offsetPadding}px;`
      ]),
      sentinel: joinArray([
        'position:absolute;height:1px;width:1px;',
        `${isVertical ? 'left' : 'top'}:0;`,
        `${startProp}:${Math.max(nextTotalSize - 1, 0)}px;`
      ])
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
