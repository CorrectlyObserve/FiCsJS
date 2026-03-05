import { fics } from 'ficsjs'
import { oklch } from 'ficsjs/style'
import Menu from '@/pages/_components/Menu'
import { Direction } from '@/types'
import { white } from '@/utils'

interface Data {
  droppedZone: HTMLElement | null
  isHighlighted: (droppedZone: HTMLElement | null, zoneIndex: string | number) => boolean
  draggingIndex: number
  height: number
  getDraggableElement: (target: EventTarget | null) => HTMLElement | null
  focusItemByIndex: (target: HTMLElement | null, index: number) => void
}

interface Props<T> {
  array: T[]
  slot: (item: T, index: number) => ReturnType<typeof fics>
  isSelected: (item: T) => boolean
  getNewItem: (item: T) => T | Promise<T>
  updateArray: (newArray: T[]) => void
  selectItem: (item: T) => void
}

const DRAGGABLE_ATTR = '[draggable="true"]' as const,
  getUpdatedArray = async <T>({
    array,
    fromIndex,
    toIndex,
    isCopy,
    getNewItem
  }: {
    array: T[]
    fromIndex: number
    toIndex: number
    isCopy: boolean
    getNewItem: (item: T) => T | Promise<T>
  }): Promise<T[] | null> => {
    if (!Number.isInteger(fromIndex) || fromIndex < 0 || !Number.isInteger(toIndex) || toIndex < 0)
      return null

    if (
      (isCopy && toIndex > array.length) ||
      (!isCopy && (toIndex > array.length - 1 || toIndex === fromIndex))
    )
      return null

    const item = array[fromIndex]
    if (item === undefined) return null

    const newArray: T[] = [...array]

    if (isCopy) newArray.splice(toIndex, 0, await getNewItem(item))
    else {
      newArray.splice(fromIndex, 1)
      newArray.splice(toIndex, 0, item)
    }

    return newArray
  }

export default <T>() =>
  fics<Data, Props<T>>({
    name: 'draggable',
    children: [Menu],
    props: {
      descendant: ({ children: { menu } }) => menu,
      values: ({ props: { array, isSelected, getNewItem, updateArray } }) => ({
        moveItem: async (direction: Direction, isCopy: boolean) => {
          const fromIndex = array.findIndex(item => isSelected(item))
          if (fromIndex < 0) return

          const toIndex = fromIndex + (direction === 'up' ? -1 : 1),
            newArray: T[] | null = await getUpdatedArray({
              array,
              fromIndex,
              toIndex,
              isCopy,
              getNewItem
            })

          if (!newArray) return
          updateArray(newArray)
        }
      })
    },
    data: () => ({
      droppedZone: null,
      isHighlighted: (droppedZone: HTMLElement | null, zoneIndex: string | number) => {
        if (typeof zoneIndex === 'number') zoneIndex = zoneIndex.toString()
        return droppedZone?.getAttribute('key') === zoneIndex
      },
      draggingIndex: NaN,
      height: 0,
      getDraggableElement: (target: EventTarget | null): HTMLElement | null => {
        if (!target) return null

        const element = target as HTMLElement
        if (element.getAttribute('draggable') === 'true') return element

        const draggableElement = element.closest(DRAGGABLE_ATTR)
        return draggableElement instanceof HTMLElement ? draggableElement : null
      },
      focusItemByIndex: (element: HTMLElement | null, index: number) => {
        if (!element) return

        const root = element.getRootNode()
        if (root instanceof ShadowRoot || root instanceof Document)
          setTimeout(() => {
            const selector = `div${DRAGGABLE_ATTR}[key="${index}-slot"]`,
              element = root.querySelector(selector) as HTMLElement | null

            if (!element) return
            element.focus()
          })
      }
    }),
    html: ({
      children: { menu },
      data: { droppedZone, isHighlighted },
      props: { array, slot, isSelected },
      template,
      attributes: { boolean }
    }) => {
      const _isHighlighted = (zoneIndex: number) => isHighlighted(droppedZone, zoneIndex),
        base =
          'dragged-over rounded-lg border border-dashed transition duration-200 ease-out' as const,
        dropZone = (zoneIndex: number, classNames: string) => template`
          <div
            class="drop-zone ${_isHighlighted(zoneIndex) ? `${base} ${classNames}` : 'h-4'}"
            key="${zoneIndex}"
          ></div>
        `

      return template`
        ${menu}
        ${dropZone(-1, 'my-4')}
        ${array.map((item, index) => {
          const isAtLast = index === array.length - 1,
            classNames = isAtLast ? `mt-4${_isHighlighted(index) ? ' mb-height' : ''}` : 'my-4'

          return template`
            <div
              class="clickable rounded-lg py-1"
              key="${index}-slot"
              draggable="true"
              tabindex="0"
              role="button"
              aria-pressed="${boolean(isSelected(item))}"
            >${slot(item, index)}</div>
            ${dropZone(index, classNames)}
          `
        })}
      `
    },
    css: {
      div: ({ data: { height } }) => ({
        '&[tabindex="0"]:hover': { background: white(0.1) },
        '&[draggable="true"].is-dragging:focus, &[draggable="true"].is-dragging:focus-visible': {
          outline: 'none'
        },
        '&.dragged-over': {
          height: `${height}px`,
          background: white(0.05),
          borderColor: oklch('#4169e1')
        },
        '&.mb-height': { marginBlockEnd: `${height}px` }
      })
    },
    actions: {
      'div.drop-zone': {
        dragover: ({ data, event, attributes: { key } }) => {
          const drag = event as DragEvent
          drag.preventDefault()

          if (!drag.dataTransfer) return

          const { altKey: isCopy, currentTarget } = drag
          drag.dataTransfer.dropEffect = isCopy ? 'copy' : 'move'

          const zoneIndex = parseInt(key)
          if (!Number.isInteger(zoneIndex)) return

          if (
            !isCopy &&
            (zoneIndex === data.draggingIndex - 1 || zoneIndex === data.draggingIndex)
          ) {
            if (data.droppedZone) data.droppedZone = null
            return
          }

          if (currentTarget instanceof HTMLElement && data.droppedZone !== currentTarget)
            data.droppedZone = currentTarget
        },
        dragleave: ({ data, attributes: { key } }) => {
          if (data.isHighlighted(data.droppedZone, key)) data.droppedZone = null
        },
        drop: async ({
          data,
          props: { array, getNewItem, updateArray },
          event,
          attributes: { key }
        }) => {
          const drag = event as DragEvent
          drag.preventDefault()
          if (!drag.dataTransfer) return

          if (!data.isHighlighted(data.droppedZone, key)) return

          data.droppedZone = null

          let zoneIndex = parseInt(key)
          if (!Number.isInteger(zoneIndex)) return

          zoneIndex++
          const fromIndex = parseInt(drag.dataTransfer.getData('text/plain')),
            isCopy = drag.altKey,
            newArray: T[] | null = await getUpdatedArray({
              array,
              fromIndex,
              toIndex: isCopy || fromIndex >= zoneIndex ? zoneIndex : zoneIndex - 1,
              isCopy,
              getNewItem
            })

          if (!newArray) return

          updateArray(newArray)

          const { activeElement } = document
          if (activeElement instanceof HTMLElement) activeElement.blur()
        }
      },
      [`div${DRAGGABLE_ATTR}`]: {
        dragstart: ({ data, event, attributes: { key } }) => {
          const drag = event as DragEvent
          if (!drag.dataTransfer) return

          const index = parseInt(key)

          drag.dataTransfer.setData('text/plain', index.toString())
          drag.dataTransfer.effectAllowed = 'copyMove'

          data.draggingIndex = index

          const draggableElement = data.getDraggableElement(event.currentTarget)
          if (draggableElement) {
            draggableElement.classList.add('is-dragging')
            data.height = draggableElement.offsetHeight
          }
        },
        dragover: [
          ({ data, event, attributes: { key } }) => {
            const drag = event as DragEvent
            drag.preventDefault()
            if (!drag.dataTransfer) return

            drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'

            const draggableElement = data.getDraggableElement(event.currentTarget)
            if (!draggableElement) return

            const index = parseInt(key),
              { top, height } = draggableElement.getBoundingClientRect(),
              isAfter = drag.clientY > top + height / 2,
              { draggingIndex, droppedZone } = data

            if (
              !drag.altKey &&
              ((index === draggingIndex - 1 && isAfter) ||
                (index === draggingIndex + 1 && !isAfter) ||
                index === draggingIndex)
            ) {
              if (droppedZone) data.droppedZone = null
              return
            }

            const sibling = draggableElement[`${isAfter ? 'next' : 'previous'}ElementSibling`],
              targetZone = sibling && sibling.classList.contains('drop-zone') ? sibling : null

            if (targetZone && droppedZone !== targetZone)
              data.droppedZone = targetZone as HTMLElement
          },
          { throttle: 200 }
        ],
        dragend: ({ data, event }) => {
          data.draggingIndex = NaN
          if (data.droppedZone) data.droppedZone = null

          const draggableElement = data.getDraggableElement(event.currentTarget)
          if (draggableElement) draggableElement.classList.remove('is-dragging')
        },
        click: [
          ({
            data: { getDraggableElement },
            props: { array, selectItem },
            event,
            attributes: { key }
          }) => {
            selectItem(array[parseInt(key)])

            const element = getDraggableElement(event.currentTarget)
            if (!element) return

            element.focus()
          },
          { throttle: 500 }
        ],
        keydown: async ({
          data: { getDraggableElement, focusItemByIndex },
          props: { array, getNewItem, updateArray, selectItem },
          event,
          attributes: { key }
        }) => {
          const keyEvent = event as KeyboardEvent,
            fromIndex = parseInt(key),
            item: T | undefined = array[fromIndex]

          if (item === undefined) return

          const element = getDraggableElement(event.currentTarget)

          if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
            keyEvent.preventDefault()
            selectItem(item)

            if (!element) return

            element.focus()
            return
          }

          const isArrowUp = keyEvent.key === 'ArrowUp',
            isArrowDown = keyEvent.key === 'ArrowDown'

          if (!isArrowUp && !isArrowDown) return
          keyEvent.preventDefault()

          const toIndex = fromIndex + (isArrowUp ? -1 : 1),
            newArray: T[] | null = await getUpdatedArray({
              array,
              fromIndex,
              toIndex,
              isCopy: keyEvent.altKey,
              getNewItem
            })

          if (!newArray) return

          updateArray(newArray)
          focusItemByIndex(element, toIndex)
        }
      }
    }
  })
