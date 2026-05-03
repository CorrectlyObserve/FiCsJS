import type { Scroll } from '../../types'
import { evictCache, rebuildFenwickTrees } from '../cache'
import consts from '../constants'
import { fenwickTree, getProperty, isValidNumber } from '../helpers'
import { getItemsInScrollArea, updateFirstVisible } from './dom'
import { updateAveSize, updateRange } from './virtualizer'

const isKeyChanged = (key: string, prevKey: string | undefined): prevKey is string =>
    prevKey !== undefined && prevKey !== key,
  upsertMeasuredSize = ({
    cache,
    key,
    index,
    size,
    fenwickTreeIndex,
    sizeFenwickTree,
    countFenwickTree
  }: {
    cache: Scroll.Cache
    key: string
    index: number
    size: number
    fenwickTreeIndex: number
    sizeFenwickTree: number[]
    countFenwickTree: number[]
  }): { prevSize: number | undefined; prevIndexSize: number | undefined } => {
    const prevSize: number | undefined = cache.elementSizes.get(key),
      prevIndexSize: number | undefined = cache.indexSizes.get(index)

    if (prevIndexSize !== size)
      fenwickTree.add(sizeFenwickTree, fenwickTreeIndex, size - (prevIndexSize ?? 0))

    if (prevIndexSize === undefined) fenwickTree.add(countFenwickTree, fenwickTreeIndex, 1)

    cache.elementSizes.set(key, size)
    cache.indexSizes.set(index, size)
    cache.indexKeys.set(index, key)

    return { prevSize, prevIndexSize }
  }

export default <D extends object, P>({
  getScrollOptions,
  getIsVertical,
  observers,
  root,
  instanceId,
  unit,
  itemMinSize,
  bufferLength,
  thresholdRatio,
  reRender
}: {
  getScrollOptions: () => Scroll.Resolved<D, P>
  getIsVertical: () => boolean
  observers: Omit<Scroll.Observers, 'root'>
  root: HTMLElement
  instanceId: string
  unit: number
  itemMinSize: number
  bufferLength: number
  thresholdRatio: number
  reRender: Scroll.Ctx.Runtime<D, P>['reRender']
}): void => {
  const scrollOptions: Scroll.Resolved<D, P> = getScrollOptions(),
    { cache, endIndex, startIndex }: Scroll.Resolved<D, P> = scrollOptions,
    { maxLength, indexKeys, sizeFenwickTree, countFenwickTree }: Scroll.Cache = cache

  evictCache({ cache, index: Math.max(0, endIndex - maxLength) })

  const items: HTMLElement[] = getItemsInScrollArea({ root, instanceId })

  let isReordered: boolean = false

  for (const [index, item] of items.entries()) {
    const key: string | null = item.getAttribute('key')
    if (!key) throw new Error('Virtual scroll items must have a unique "key" attribute...')

    const absoluteIndex: number = startIndex + index,
      prevKey: string | undefined = indexKeys.get(absoluteIndex)

    if (isKeyChanged(key, prevKey)) {
      isReordered = true
      break
    }
  }

  if (isReordered) {
    cache.elementSizes.clear()
    cache.indexSizes.clear()
    cache.indexKeys.clear()
  }
  rebuildFenwickTrees(cache, isReordered ? 'force' : 'if-needed')

  cache.elementIndexes = new WeakMap()

  const isVertical: boolean = getIsVertical()
  let hasSizeChanged: boolean = false

  for (const [index, item] of items.entries()) {
    const absoluteIndex: number = startIndex + index,
      /**
       * @remarks The fenwick tree is 1-indexed.
       */
      fenwickTreeIndex: number = absoluteIndex - cache.startIndex + 1,
      key: string | null = item.getAttribute('key')

    if (!key) continue

    /**
     * @remarks Prevents excessive updates during rapid scrolling.
     */
    if (fenwickTreeIndex < 1 || fenwickTreeIndex > maxLength) continue

    /**
     * @remarks Prepares element-to-index mapping before measurement.
     */
    cache.elementIndexes.set(item, absoluteIndex)

    const prevKey: string | undefined = indexKeys.get(absoluteIndex)
    if (!isReordered && isKeyChanged(key, prevKey)) {
      cache.elementSizes.delete(prevKey)
      cache.indexSizes.delete(absoluteIndex)
    }

    const size: number = (item.getBoundingClientRect() as any)[
      getProperty({ isVertical, type: 'size' })
    ]
    if (!isValidNumber(size)) continue

    const {
      prevSize,
      prevIndexSize
    }: { prevSize: number | undefined; prevIndexSize: number | undefined } = upsertMeasuredSize({
      cache,
      key,
      index: absoluteIndex,
      size,
      fenwickTreeIndex,
      sizeFenwickTree,
      countFenwickTree
    })

    if (isKeyChanged(key, prevKey) || prevSize !== size || prevIndexSize !== size)
      hasSizeChanged = true
  }

  const setResizeTimer = (): void => {
    const scrollOptions: Scroll.Resolved<D, P> = getScrollOptions(),
      {
        timers: { resize }
      }: Scroll.Resolved<D, P> = scrollOptions

    if (resize) clearTimeout(resize)

    scrollOptions.timers.resize = setTimeout(() => {
      const _scrollOptions: Scroll.Resolved<D, P> = getScrollOptions()

      updateAveSize({ scrollOptions: _scrollOptions, itemMinSize, thresholdRatio })
      updateRange({
        scrollOptions: _scrollOptions,
        root,
        isVertical: getIsVertical(),
        itemMinSize,
        unit,
        bufferLength,
        reRender
      })
    }, consts.FRAME_INTERVAL_MS)
  }

  if (hasSizeChanged) setResizeTimer()

  if (!observers.resize)
    observers.resize = new ResizeObserver(entries => {
      const { cache }: { cache: Scroll.Cache } = getScrollOptions(),
        {
          indexSizes,
          indexKeys,
          elementIndexes,
          startIndex,
          maxLength,
          sizeFenwickTree,
          countFenwickTree
        }: Scroll.Cache = cache
      let _hasSizeChanged: boolean = false

      for (const { target, contentRect } of entries) {
        const targetElement: HTMLElement = target as HTMLElement,
          key: string | null = targetElement.getAttribute('key')
        if (!key) continue

        const index: number | undefined = elementIndexes.get(targetElement)

        if (index === undefined) continue

        /**
         * @remarks The fenwick tree is 1-indexed.
         */
        const fenwickTreeIndex: number = index - startIndex + 1
        /**
         * @remarks Prevents excessive updates during rapid scrolling.
         */
        if (fenwickTreeIndex < 1 || fenwickTreeIndex > maxLength) continue

        const prevKey: string | undefined = indexKeys.get(index)
        if (isKeyChanged(key, prevKey)) {
          cache.elementSizes.delete(prevKey)

          const removedSize: number | undefined = indexSizes.get(index)
          if (removedSize !== undefined) {
            fenwickTree.add(sizeFenwickTree, fenwickTreeIndex, -removedSize)
            fenwickTree.add(countFenwickTree, fenwickTreeIndex, -1)
          }
          cache.indexSizes.delete(index)
        }

        const size: number = (contentRect as any)[
          getProperty({ isVertical: getIsVertical(), type: 'size' })
        ]
        if (!isValidNumber(size)) continue

        const {
          prevSize,
          prevIndexSize
        }: { prevSize: number | undefined; prevIndexSize: number | undefined } = upsertMeasuredSize(
          {
            cache,
            key,
            index,
            size,
            fenwickTreeIndex,
            sizeFenwickTree,
            countFenwickTree
          }
        )

        if (!isKeyChanged(key, prevKey) && prevSize === size && prevIndexSize === size) continue
        _hasSizeChanged = true
      }

      if (!_hasSizeChanged) return
      setResizeTimer()
    })

  observers.resize.disconnect()
  for (const item of items) observers.resize.observe(item)
  updateFirstVisible({ scrollOptions, root, instanceId, isVertical })
}
