import { fics, type FiCs } from 'ficsjs'
import { color, flex, forScreenReaders, space } from 'ficsjs/style'
import Icon from '@/components/Icon'
import type { Task } from '@/domain/task'
import {
  getDropZoneIndex,
  getInsertion,
  getToIndex,
  isValidIndex,
  MENU_ID,
  type ButtonStates,
  type Direction,
  type Insertion,
  type MenuButton,
  type ReorderLabels
} from '@/pages/_task/drag'
import DragMenu from '@/pages/_task/DragMenu'
import DropZone from '@/pages/_task/DropZone'
import { GripVertical } from 'lucide-static'

interface Data {
  status: string
  activeZoneIndex: number
  draggingIndex: number
  isCopyMode: boolean
  menuIndex: number
  focusedMenuButton: MenuButton | null
  height: number
}

interface Props {
  tasks: Task[]
  slot: (task: Task, index: number) => ReturnType<typeof fics>
  labels: ReorderLabels
  onMove: (insertion: Insertion) => void
  onCopy: (insertion: Insertion) => void
}

const placeTask = ({
  data,
  tasks,
  labels,
  onMove,
  onCopy,
  fromIndex,
  toIndex,
  isCopyMode
}: {
  data: Data
  tasks: readonly Task[]
  labels: ReorderLabels
  onMove: (insertion: Insertion) => void
  onCopy: (insertion: Insertion) => void
  fromIndex: number
  toIndex: number
  isCopyMode: boolean
}): void => {
  const insertion: Insertion | undefined = getInsertion({ tasks, fromIndex, toIndex, isCopyMode })
  if (!insertion) return

  data.status = labels[isCopyMode ? 'cloned' : 'moved']

  if (isCopyMode) onCopy(insertion)
  else {
    onMove(insertion)
    data.menuIndex = data.menuIndex === fromIndex ? toIndex : NaN
  }
}

const props: FiCs.Props<Data, Props> = [
  {
    descendants: ({ children: { icon } }) => icon,
    values: ({
      props: {
        labels: { handle }
      }
    }) => ({ svg: GripVertical, ariaLabel: handle, isDraggable: true, color: color('text-muted') })
  },
  {
    descendants: ({ children: { dropZone } }) => dropZone,
    values: ({ data: { height } }) => ({ height })
  },
  {
    descendants: ({ children: { dragMenu } }) => dragMenu,
    values: ({ data, props: { tasks, labels, onMove, onCopy } }) => {
      const { menuIndex: fromIndex, isCopyMode } = data
      const toIndex = (direction: Direction) =>
        getToIndex({ fromIndex, isDown: direction === 'down', isCopyMode })

      const buttonStates: ButtonStates = {}
      if (data.focusedMenuButton) buttonStates[data.focusedMenuButton] = 'focused'

      for (const direction of ['up', 'down'] as Direction[])
        if (!isValidIndex({ tasks, fromIndex, toIndex: toIndex(direction), isCopyMode }))
          buttonStates[direction] = 'disabled'

      return {
        labels,
        isCopyMode,
        buttonStates,
        switchCopyMode: () => (data.isCopyMode = !data.isCopyMode),
        move: (direction: Direction) => {
          const nextIndex: number = toIndex(direction)
          const isDown: boolean = direction === 'down'

          placeTask({
            data,
            tasks,
            labels,
            onMove,
            onCopy,
            fromIndex,
            toIndex: nextIndex,
            isCopyMode
          })

          const isAtEdge: boolean = !isValidIndex({
            tasks,
            fromIndex: nextIndex,
            toIndex: getToIndex({ fromIndex: nextIndex, isDown, isCopyMode }),
            isCopyMode
          })

          if (!isCopyMode && isAtEdge) data.focusedMenuButton = isDown ? 'up' : 'down'
        }
      }
    }
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { icon, dropZone, dragMenu },
  data,
  props: { tasks, slot, labels, onMove, onCopy },
  template,
  attributes: {
    a11y: { liveStatus }
  }
}) => {
  const { activeZoneIndex, draggingIndex: fromIndex, menuIndex, status } = data
  const zone = (zoneIndex: number) => {
    const isActive = activeZoneIndex === zoneIndex

    return dropZone.setIndividualProps(zoneIndex, {
      isActive,
      isValidIndex: (isCopyMode: boolean) =>
        isValidIndex({
          tasks,
          fromIndex,
          toIndex: getDropZoneIndex({ fromIndex, zoneIndex, isCopyMode }),
          isCopyMode
        }),
      activate: () => {
        if (!isActive) data.activeZoneIndex = zoneIndex
      },
      deactivate: () => {
        if (isActive) data.activeZoneIndex = NaN
      },
      drop: (fromIndex: number, isCopyMode: boolean) => {
        data.activeZoneIndex = NaN
        placeTask({
          data,
          tasks,
          labels,
          onMove,
          onCopy,
          fromIndex,
          toIndex: getDropZoneIndex({ fromIndex, zoneIndex, isCopyMode }),
          isCopyMode
        })
      }
    })
  }

  return template`
    <p ${liveStatus}>${status}</p>
    <div popover id="${MENU_ID}">${dragMenu}</div>
    <div role="list">
      ${zone(-1)}
      ${tasks.map(
        (task, index) => template`
          <div class="row" role="listitem" key="${index}-row">
            <div class="handle" key="${index}-handle">
              ${icon.setIndividualProps(index, {
                state: menuIndex === index ? 'expanded' : undefined,
                click: (event: MouseEvent) => {
                  if ((event as PointerEvent).pointerType === 'mouse') return
                  data.menuIndex = data.menuIndex === index ? NaN : index
                }
              })}
            </div>
            ${slot(task, index)}
          </div>
          ${zone(index)}
        `
      )}
    </div>
  `
}

const css: FiCs.Css<Data, Props> = `
  p { ${forScreenReaders} }

  div {
    &.row { ${flex({ center: 'y', gap: space('xs') })} }

    &[popover] {
      position-anchor: auto;
      position-area: block-end span-inline-end;
      margin-block-start: ${space('xs')};
      border: 0;
    }
  }
`

const getFocusedElement = (): Element | null => {
  let active: Element | null = document.activeElement

  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement

  return active
}

const hooks: FiCs.Hooks<Data, Props> = {
  updated: {
    menuIndex: ({ data, ref }) => {
      const popover: Element | null = ref('[popover]')
      if (!(popover instanceof HTMLElement)) return

      const isOpen = popover.matches(':popover-open')

      if (Number.isNaN(data.menuIndex)) {
        if (isOpen) popover.hidePopover()
        data.focusedMenuButton = null
        return
      }

      const source: Element | null = ref(`div.handle[key="${data.menuIndex}-handle"]`)
      if (!(source instanceof HTMLElement)) return

      const focused: Element | null = getFocusedElement()

      isOpen ? popover.hidePopover() : (data.focusedMenuButton = 'copy')
      popover.showPopover({ source })

      if (focused instanceof HTMLElement && focused !== document.body) focused.focus()
    }
  }
}

const actions: FiCs.Actions<Data, Props> = {
  'div.handle': {
    dragstart: ({ data, event, attributes: { key } }) => {
      const drag = event as DragEvent
      if (!drag.dataTransfer) return

      drag.dataTransfer.setData('text/plain', key)
      drag.dataTransfer.effectAllowed = 'copyMove'
      data.draggingIndex = parseInt(key)

      const row = (drag.currentTarget as HTMLElement).closest('div.row')
      if (!(row instanceof HTMLElement)) return

      data.height = row.offsetHeight

      const { left, top } = row.getBoundingClientRect()
      drag.dataTransfer.setDragImage(row, drag.clientX - left, drag.clientY - top)
    },
    dragend: ({ data }) => {
      data.draggingIndex = NaN
      if (!Number.isNaN(data.activeZoneIndex)) data.activeZoneIndex = NaN
    },
    keydown: ({ data, props: { tasks, labels, onMove, onCopy }, event, attributes: { key } }) => {
      const keyEvent = event as KeyboardEvent
      const isDown = keyEvent.key === 'ArrowDown'

      if (keyEvent.key !== 'ArrowUp' && !isDown) return
      keyEvent.preventDefault()

      const fromIndex = parseInt(key),
        isCopyMode = keyEvent.altKey

      placeTask({
        data,
        tasks,
        labels,
        onMove,
        onCopy,
        fromIndex,
        toIndex: getToIndex({ fromIndex, isDown, isCopyMode }),
        isCopyMode
      })
    },
    contextmenu: ({ data, event, attributes: { key } }) => {
      event.preventDefault()

      const index = parseInt(key)
      if (!Number.isInteger(index)) return

      const toggle = () => (data.menuIndex = data.menuIndex === index ? NaN : index)

      // Prevents Safari from closing the popover early due to macOS firing contextmenu on mousedown.
      if ((event as MouseEvent).buttons === 0) toggle()
      else addEventListener('pointerup', toggle, { once: true })
    }
  },
  'div[popover]': {
    keydown: ({ event, ref }) => {
      if ((event as KeyboardEvent).key !== 'Escape') return

      const handle: Element | null = ref('button[aria-expanded="true"]')
      if (handle instanceof HTMLElement) handle.focus()
    },
    toggle: ({ data, event }) => {
      if ((event as ToggleEvent).newState === 'closed' && !Number.isNaN(data.menuIndex))
        data.menuIndex = NaN
    }
  }
}

export default fics<Data, Props>({
  name: 'draggable',
  children: [Icon(), DropZone, DragMenu],
  data: () => ({
    status: '',
    activeZoneIndex: NaN,
    draggingIndex: NaN,
    height: 0,
    menuIndex: NaN,
    focusedMenuButton: null,
    isCopyMode: false
  }),
  props,
  html,
  css,
  hooks,
  actions
})
