import { joinArray, numberError } from '../helpers'
import { getOffsetBeforeIndex, resetCache } from './cache'
import { getAveSize, getScrollAttr } from './helpers'
import type { Html, Scroll, SetTimeout } from '../types'

const scrollTemplate = <D extends object, P extends object, T>({
  instanceId,
  getDataProps,
  template,
  scrollOptions,
  array,
  callback
}: Scroll.Ctx.Template<D, P, T>): Html.Sanitized<D, P> => {
  if (!array || array.length === 0) return template`${[]}`

  if (!scrollOptions) return template`${array.map((item, index) => callback(item, index))}`

  const totalCount: number = array.length,
    { options, id, aveSize: storedAveSize, lastAxis }: Scroll.Resolved<D, P> = scrollOptions,
    { unit, itemMinSize, axis, bufferLength }: Scroll.Options = options(getDataProps(true))

  numberError({ unit, itemMinSize, bufferLength })

  /**
   * @remarks
   * Resets the item min size.
   */
  if (!Number.isFinite(storedAveSize) || storedAveSize < itemMinSize)
    scrollOptions.aveSize = itemMinSize

  if (lastAxis !== undefined && lastAxis !== axis) {
    const { cache, startIndex, firstVisible }: Scroll.Resolved<D, P> = scrollOptions
    numberError({ startIndex }, false)

    resetCache(cache)
    const clampedIndex: number = Math.min(startIndex, totalCount - 1)
    scrollOptions.startIndex = clampedIndex
    scrollOptions.endIndex = Math.min(totalCount, clampedIndex + unit + (bufferLength ?? 0))
    scrollOptions.aveSize = itemMinSize
    scrollOptions.totalSize = NaN
    scrollOptions.prevTotalSize = NaN
    scrollOptions.flags = {
      hasScrolled: false,
      isRangeLocked: true,
      isFetchLocked: true,
      shouldRestoreAxisOffset: true
    }
    scrollOptions.fetch = { isFetching: false, lastTriggeredCount: 0 }
    firstVisible.offset = 0

    for (const key of ['resize', 'idle'] as const) {
      const timer: SetTimeout | undefined = scrollOptions.timers[key]
      if (timer) clearTimeout(timer)
      scrollOptions.timers[key] = undefined
    }
  }

  const { cache, startIndex, endIndex, totalSize, aveSize }: Scroll.Resolved<D, P> = scrollOptions
  numberError({ startIndex, endIndex }, false)

  /**
   * @remarks
   * Recalculates the `end` index to handle operations such as sorting or data updates.
   */
  if (endIndex <= startIndex)
    scrollOptions.endIndex = Math.min(totalCount, startIndex + unit + (bufferLength ?? 0))

  const resolvedAveSize: number = getAveSize({ aveSize, itemMinSize }),
    estimatedTotalSize: number = resolvedAveSize * totalCount

  let newTotalSize: number = estimatedTotalSize
  if (Number.isFinite(totalSize)) newTotalSize = Math.max(totalSize, estimatedTotalSize)

  /**
   * @remarks
   * Simulates the height of unrendered items to keep the current scroll position.
   */
  const offsetPadding: number = Math.min(
      getOffsetBeforeIndex({ cache, totalCount, index: startIndex, aveSize: resolvedAveSize }),
      newTotalSize
    ),
    isVertical: boolean = axis === 'vertical',
    styles = {
      container: joinArray([
        'position:relative;overscroll-behavior:contain;',
        `${isVertical ? 'height' : 'width'}:${itemMinSize * unit}px;`,
        `overflow-${isVertical ? 'y' : 'x'}:auto;overflow-${isVertical ? 'x' : 'y'}:hidden;`,
        isVertical ? '' : 'margin-inline:auto;'
      ]),
      wrap: joinArray([
        'box-sizing:border-box;position:relative;',
        `min-${isVertical ? 'height' : 'width'}:${newTotalSize}px;`,
        isVertical ? 'display:block;' : 'display:flex;flex-wrap:nowrap;align-items:flex-start;',
        `padding-${isVertical ? 'top' : 'left'}:${offsetPadding}px;`
      ]),
      sentinel: joinArray([
        'position:absolute;height:1px;width:1px;',
        `${isVertical ? 'left' : 'top'}:0;`,
        `${isVertical ? 'top' : 'left'}:${Math.max(newTotalSize - 1, 0)}px;`
      ])
    } as const,
    div = (type: Scroll.Div, contents?: Html.Sanitized<D, P>[]): Html.Sanitized<D, P> => template`
      <div ${getScrollAttr({ instanceId, type, hasValue: true })} key="${id}-${type}" style="${styles[type]}">
        ${contents ?? ''}
      </div>
    `

  scrollOptions.totalSize = newTotalSize
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

export default scrollTemplate
