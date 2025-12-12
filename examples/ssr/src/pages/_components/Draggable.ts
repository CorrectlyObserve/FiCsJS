import { fics } from 'ficsjs'
import { oklch } from 'ficsjs/style'
import { white } from '@/utils'

interface Data {
  droppedZone: HTMLElement | null
  isHighlighted: (droppedZone: HTMLElement | null, zoneIndex: string | number) => boolean
  draggingIndex: number
  height: number
  getDraggableElement: (target: EventTarget | null) => HTMLElement | null
}

interface Props<T> {
  array: T[]
  slot: (item: T, index: number) => ReturnType<typeof fics>
  drop: (params: { fromIndex: number; zoneIndex: number; altKey: boolean }) => Promise<void> | void
}

export default <T>() =>
  fics<Data, Props<T>>({
    name: 'draggable',
    data: () => ({
      droppedZone: null,
      isHighlighted: (droppedZone: HTMLElement | null, zoneIndex: string | number) => {
        if (typeof zoneIndex === 'number') zoneIndex = zoneIndex.toString()
        return droppedZone?.getAttribute('key') === zoneIndex
      },
      draggingIndex: NaN,
      height: 0,
      getDraggableElement: (target: EventTarget | null) => {
        if (!target) return null

        const element = target as HTMLElement

        if (element.getAttribute('draggable') === 'true') return element

        const draggable = element.closest('[draggable="true"]')
        if (!draggable) return null

        return draggable as HTMLElement
      }
    }),
    html: ({ data: { droppedZone, isHighlighted }, props: { array, slot }, template }) => {
      const base =
          'dragged-over rounded-sm border border-dashed transition duration-200 ease-out' as const,
        dropZone = (zoneIndex: number, classNames: string) => template`
          <div
            class="drop-zone ${isHighlighted(droppedZone, zoneIndex) ? `${base} ${classNames}` : 'h-4'}"
            key="${zoneIndex}"
          ></div>
        `

      return template`
        ${dropZone(-1, 'my-4')}
        ${array.map((item, index) => {
          const isLast = index === array.length - 1,
            classNames = isLast
              ? isHighlighted(droppedZone, index)
                ? 'mt-4 mb-height'
                : 'mt-4'
              : 'my-4'

          return template`
            <div key="${index}-slot" draggable="true" tabindex="0">${slot(item, index)}</div>
            ${dropZone(index, classNames)}
          `
        })}
      `
    },
    css: {
      div: ({ data: { height } }) => ({
        '&.dragged-over': {
          height: `${height}px`,
          background: white(0.05),
          borderColor: oklch('#4169e1')
        },
        '&.mb-height': { marginBottom: `${height}px` }
      })
    },
    actions: {
      'div.drop-zone': {
        dragover: ({ event }) => {
          const drag = event as DragEvent
          drag.preventDefault()

          if (!drag.dataTransfer) return
          drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'
        },
        dragleave: ({ data: { isHighlighted }, setData, getData, attributes: { key } }) => {
          if (isHighlighted(getData('droppedZone'), key)) setData('droppedZone', null)
        },
        drop: async ({
          data: { isHighlighted },
          props: { drop },
          setData,
          getData,
          event,
          attributes: { key }
        }) => {
          const drag = event as DragEvent
          drag.preventDefault()
          if (!drag.dataTransfer) return

          if (!isHighlighted(getData('droppedZone'), key)) return

          setData('droppedZone', null)
          await drop({
            fromIndex: parseInt(drag.dataTransfer.getData('text/plain')),
            zoneIndex: parseInt(key),
            altKey: drag.altKey
          })
        }
      },
      'div[draggable="true"]': {
        dragstart: ({ data: { getDraggableElement }, setData, event, attributes: { key } }) => {
          const drag = event as DragEvent
          if (!drag.dataTransfer) return

          const index = parseInt(key)

          drag.dataTransfer.setData('text/plain', index.toString())
          drag.dataTransfer.effectAllowed = 'copyMove'

          setData('draggingIndex', index)

          const { offsetHeight } = getDraggableElement(event.target) || {}
          setData('height', offsetHeight || 0)
        },
        dragover: [
          ({ data: { getDraggableElement }, setData, getData, event, attributes: { key } }) => {
            const drag = event as DragEvent
            drag.preventDefault()
            if (!drag.dataTransfer) return

            drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'

            const draggableElement = getDraggableElement(event.target)
            if (!draggableElement) return

            const index = parseInt(key),
              { top, height } = draggableElement.getBoundingClientRect(),
              isAfter = drag.clientY > top + height / 2,
              draggingIndex = getData('draggingIndex'),
              droppedZone = getData('droppedZone')

            if (
              !drag.altKey &&
              ((index === draggingIndex - 1 && isAfter) ||
                (index === draggingIndex + 1 && !isAfter) ||
                index === draggingIndex)
            ) {
              if (droppedZone) setData('droppedZone', null)
              return
            }

            const sibling = draggableElement[`${isAfter ? 'next' : 'previous'}ElementSibling`],
              targetZone = sibling && sibling.classList.contains('drop-zone') ? sibling : null

            if (targetZone && droppedZone !== targetZone)
              setData('droppedZone', targetZone as HTMLElement)
          },
          { throttle: 200 }
        ],
        dragend: ({ setData, getData }) => {
          setData('draggingIndex', NaN)
          if (getData('droppedZone')) setData('droppedZone', null)
        },
        keydown: async ({ props: { drop }, event, attributes: { key } }) => {
          const KeyEvent = event as KeyboardEvent,
            isArrowUp = KeyEvent.key === 'ArrowUp'

          if (!isArrowUp && KeyEvent.key !== 'ArrowDown') return
          KeyEvent.preventDefault()

          const fromIndex = parseInt(key)
          await drop({ fromIndex, zoneIndex: isArrowUp ? fromIndex - 1 : fromIndex, altKey: false })
        }
      }
    }
  })
