import { fics, type FiCs } from 'ficsjs'
import { flexCenter, forScreenReaders, size } from 'ficsjs/style'
import Icon from '@/components/Icon'
import type { Task } from '@/domain/task'
import {
  type Direction,
  getDropZoneIndex,
  getInsertion,
  getToIndex,
  isValidIndex,
  MENU_ID,
  type Insertion,
  type ReorderLabels
} from '@/pages/_task/drag'
import DragMenu from '@/pages/_task/DragMenu'
import DropZone from '@/pages/_task/DropZone'
import { white } from '@/styles/theme'
import { GripVertical } from 'lucide-static'

interface Data {
  status: string
  activeZoneIndex: number
  draggingIndex: number
  isCopyMode: boolean
  menuIndex: number
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
    }) => ({
      svg: GripVertical,
      ariaLabel: handle,
      hasPopup: true,
      isDraggable: true,
      color: white(0.75)
    })
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

      return {
        labels,
        isCopyMode,
        disabledDirections: (['up', 'down'] as const).filter(
          direction => !isValidIndex({ tasks, fromIndex, toIndex: toIndex(direction), isCopyMode })
        ),
        switchCopyMode: () => (data.isCopyMode = !data.isCopyMode),
        move: (direction: Direction) =>
          placeTask({
            data,
            tasks,
            labels,
            onMove,
            onCopy,
            fromIndex,
            toIndex: toIndex(direction),
            isCopyMode
          })
      }
    }
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { icon, dropZone, dragMenu },
  data,
  props: { tasks, slot, labels, onMove, onCopy },
  template,
  attributes: { statusLiveRegion }
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
    <p ${statusLiveRegion}>${status}</p>
    <div popover id="${MENU_ID}">${dragMenu}</div>
    ${zone(-1)}
    ${tasks.map(
      (task, index) => template`
        <div class="row" role="listitem" key="${index}-row">
          <div class="handle" key="${index}-handle">
            ${icon.setIndividualProps(index, { isExpanded: menuIndex === index })}
          </div>
          ${slot(task, index)}
        </div>
        ${zone(index)}
      `
    )}
  `
}

const css: FiCs.Css<Data, Props> = `
  p {${forScreenReaders}}

  div {
    &.row {
      ${flexCenter('y')}
      gap: ${size(1)};
    }

    &[popover] {
      position-anchor: auto;
      position-area: block-end span-inline-end;
      margin-block-start: ${size(1)};
      border: 0;
    }
  }
`

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

      /** @remarks Prevents Safari from closing the popover early due to macOS firing contextmenu on mousedown. */
      if ((event as MouseEvent).buttons === 0) toggle()
      else addEventListener('pointerup', toggle, { once: true })
    }
  },
  'div[popover]': {
    toggle: ({ data, event }) => {
      if ((event as ToggleEvent).newState === 'closed' && !Number.isNaN(data.menuIndex))
        data.menuIndex = NaN
    }
  }
}

const hooks: FiCs.Hooks<Data, Props> = {
  updated: {
    menuIndex: ({ data: { menuIndex }, ref }) => {
      const popover: Element | null = ref('[popover]')
      if (!(popover instanceof HTMLElement)) return

      const isOpen = popover.matches(':popover-open')

      if (Number.isNaN(menuIndex)) {
        if (isOpen) popover.hidePopover()
        return
      }

      const source: Element | null = ref(`div.handle[key="${menuIndex}-handle"]`)
      if (!(source instanceof HTMLElement)) return

      if (isOpen) popover.hidePopover()
      popover.showPopover({ source })
    }
  }
}

export default fics<Data, Props>({
  name: 'draggable',
  children: [Icon(), DropZone, DragMenu],
  data: () => ({
    activeZoneIndex: NaN,
    draggingIndex: NaN,
    height: 0,
    menuIndex: NaN,
    isCopyMode: false,
    status: ''
  }),
  props,
  attributes: { role: 'list' },
  html,
  css,
  hooks,
  actions
})
