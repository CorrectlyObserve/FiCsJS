import type { Scroll } from '../../types'
import { setSize } from '../cache'
import { FRAME_INTERVAL_MS } from '../constants'
import { getAnchor, isValidNumber, roundSize } from '../helpers'
import {
  getIsRtl,
  getItemsInScrollArea,
  measureItemSize,
  restoreAnchor,
  updateFirstVisible
} from './dom'
import { updateAveSize, updateRange } from './virtualizer'

const createResizeObserver = <D extends object, P>(
  ctx: Scroll.Ctx.Resize<D, P>
): ResizeObserver => {
  const { getScrollOptions, root, instanceId, getIsVertical }: Scroll.Ctx.Resize<D, P> = ctx

  return new ResizeObserver(entries => {
    const scrollOptions: Scroll.Resolved<D, P> = getScrollOptions(),
      { cache }: Scroll.Resolved<D, P> = scrollOptions,
      { keys, elementIndexes }: Scroll.Cache = cache,
      isVertical: boolean = getIsVertical(),
      isRtl: boolean = getIsRtl(root, isVertical)

    let hasSizeChanged: boolean = false

    for (const { target } of entries) {
      const targetElement: HTMLElement = target as HTMLElement,
        index: number | undefined = elementIndexes.get(targetElement)

      if (index === undefined) continue

      const key: Scroll.Key | undefined = keys[index]
      if (key === undefined) continue

      const { nextElementSibling }: Element = targetElement,
        size: number = roundSize(
          measureItemSize({
            item: targetElement,
            nextItem:
              nextElementSibling && elementIndexes.has(nextElementSibling)
                ? nextElementSibling
                : null,
            isVertical,
            isRtl
          })
        )
      if (!isValidNumber(size)) continue

      if (setSize({ cache, index, key, size }) !== size) hasSizeChanged = true
    }

    if (!hasSizeChanged) return

    scrollOptions.anchors.latest = getAnchor(scrollOptions)
    restoreAnchor({ scrollOptions, root, instanceId, isVertical })
    updateFirstVisible({ scrollOptions, root, instanceId, isVertical })

    scheduleRangeUpdate(ctx)
  })
}

const scheduleRangeUpdate = <D extends object, P>({
  getScrollOptions,
  root,
  instanceId,
  getIsVertical,
  getOptions,
  reRender
}: Scroll.Ctx.Resize<D, P>): void => {
  const { timers }: Scroll.Resolved<D, P> = getScrollOptions()

  if (timers.resize) clearTimeout(timers.resize)

  timers.resize = setTimeout(() => {
    const scrollOptions: Scroll.Resolved<D, P> = getScrollOptions(),
      /** @remarks Reads the options again, as they may change after the resize observer is created. */
      options = getOptions()

    updateAveSize({ scrollOptions, ...options })
    updateRange({
      scrollOptions,
      root,
      instanceId,
      isVertical: getIsVertical(),
      reRender,
      ...options
    })
  }, FRAME_INTERVAL_MS)
}

export const syncResize = <D extends object, P>(ctx: Scroll.Ctx.Resize<D, P>): void => {
  const { getScrollOptions, root, instanceId, getIsVertical, observers }: Scroll.Ctx.Resize<D, P> =
      ctx,
    scrollOptions: Scroll.Resolved<D, P> = getScrollOptions(),
    {
      cache,
      rendered: { startIndex }
    }: Scroll.Resolved<D, P> = scrollOptions,
    items: HTMLElement[] = getItemsInScrollArea({ root, instanceId }),
    isVertical: boolean = getIsVertical(),
    isRtl: boolean = getIsRtl(root, isVertical)

  cache.elementIndexes = new WeakMap()

  let hasSizeChanged: boolean = false,
    firstResizedIndex: number | undefined

  for (const [index, item] of items.entries()) {
    const absoluteIndex: number = startIndex + index,
      key: Scroll.Key | undefined = cache.keys[absoluteIndex],
      keyAttr: string | null = item.getAttribute('key')

    if (!keyAttr) throw new Error('Virtual scroll items must have a unique "key" attribute...')

    if (keyAttr !== String(key) && !scrollOptions.flags.hasKeyWarned) {
      scrollOptions.flags.hasKeyWarned = true
      console.warn(
        `The key attribute "${keyAttr}" differs from the getKey value "${key}", which it must match...`
      )
    }

    if (key === undefined) continue

    /** @remarks Prepares element-to-index mapping before measurement. */
    cache.elementIndexes.set(item, absoluteIndex)

    const size: number = roundSize(
      measureItemSize({ item, nextItem: items[index + 1], isVertical, isRtl })
    )
    if (!isValidNumber(size)) continue

    const prevSize: number | undefined = setSize({ cache, index: absoluteIndex, key, size })
    if (prevSize === size) continue

    hasSizeChanged = true
    if (prevSize !== undefined) firstResizedIndex ??= absoluteIndex
  }

  /** @remarks Keeps the first visible item in place, as earlier items changed size. */
  if (
    firstResizedIndex !== undefined &&
    firstResizedIndex < (scrollOptions.firstVisible.index ?? 0)
  ) {
    scrollOptions.anchors.latest = getAnchor(scrollOptions)
    restoreAnchor({ scrollOptions, root, instanceId, isVertical })
  }

  updateFirstVisible({ scrollOptions, root, instanceId, isVertical })

  if (hasSizeChanged) scheduleRangeUpdate(ctx)

  observers.resize ??= createResizeObserver(ctx)
  observers.resize.disconnect()
  for (const item of items) observers.resize.observe(item)
}
