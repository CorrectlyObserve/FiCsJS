import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { api, users } from '@/data/users'
import type { Method, User } from '@/types'
import { GripVertical } from 'lucide-static'

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default fics({
  name: 'users',
  children: [Button()],
  data: () => ({
    methods: ['PUT', 'PATCH', 'DELETE'] as Method[],
    users,
    userId: NaN,
    draggingId: NaN,
    highlightedZone: null as HTMLElement | null,
    isHighlighted: (highlightedZone: HTMLElement | null, zoneId: number) =>
      highlightedZone?.getAttribute('key') === zoneId.toString()
  }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({}) => ({ isDisabled: ({ getData }) => isNaN(getData('userId')) })
  },
  html: ({
    children: { button },
    data: { methods, users, userId, draggingId, highlightedZone, isHighlighted },
    setData,
    crud,
    template,
    html
  }) => template`
    <div class="buttons mb-6 gap-4">
      ${methods.map((method, index) =>
        button.setIndividualProps(index, {
          buttonText: method,
          click: async () => {
            const options = { method, ...headers }

            if (method === 'DELETE') {
              await crud<User>(`${api}/${userId}`, options)
              setData(
                'users',
                users.filter(({ id }) => id !== userId)
              )
            } else {
              const name = prompt('Please enter a new user name.')
              if (name) {
                await crud<User>(`${api}/${userId}`, {
                  ...options,
                  body: JSON.stringify({ id: userId, name })
                })
                setData(
                  'users',
                  users.map(user => (user.id === userId ? { ...user, name } : user))
                )
              }
            }

            setData('userId', NaN)
          }
        })
      )}
    </div>
    <div class="w-fit mx-auto">
      <div class="drop-zone h-4 ${isHighlighted(highlightedZone, -1) ? 'dragged-over' : ''}" key="-1"></div>
      ${users.map((user, index) => {
        const keys = ['id', 'name', 'email'] as const

        return template`
          <div
            class="${draggingId === user.id ? 'dragging' : ''}"
            key="${index}"
            draggable="true"
          >
            <div
              class="text-white p-3 cursor-grab" tabindex="0"
              aria-label="Move user id: ${user.id}"
              key="${index}-grid"
            >
              ${html(GripVertical)}
            </div>
            <div class="clickable space-y-2" key="${user.id}" tabindex="0">
              ${keys.map((key, _index) => {
                const _key = keys[_index]
                return template`
                  <p class="text-base ${user.id === userId ? 'text-red' : 'text-white'}" key="${index}-${key}">
                    ${_key.charAt(0).toUpperCase() + _key.slice(1)}: ${user[key]}
                  </p>
                `
              })}
            </div>
          </div>
          <div class="drop-zone h-4 ${isHighlighted(highlightedZone, index) ? 'dragged-over' : ''}" key="${index}"></div>
        `
      })}
    </div>
  `,
  css: {
    div: {
      '&.buttons': flexCenter('x'),
      '&.dragged-over': {
        height: '3rem',
        backgroundColor: 'rgba(70, 130, 230, 0.15)',
        border: '1px dashed royalblue',
        margin: '5px 0',
        borderRadius: '4px'
      },
      '&.w-fit > div': flexCenter('y'),
      '&.dragging': { opacity: 0.4, pointerEvents: 'none' }
    }
  },
  hooks: {
    mounted: async ({ setData, getData, crud }) => {
      const users = getData('users')
      setData('users', [
        ...users,
        await crud<User>(api, {
          method: 'POST',
          body: JSON.stringify(users[Math.floor(Math.random() * users.length)]),
          headers
        })
      ])
    }
  },
  actions: {
    'div.drop-zone': {
      dragover: ({ event }) => {
        const drag = event as DragEvent
        drag.preventDefault()

        if (drag.dataTransfer) drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'
      },
      dragleave: ({ setData, getData, attributes: { key } }) => {
        const highlightedZone = getData('highlightedZone'),
          zoneId = highlightedZone?.getAttribute('key')

        if (zoneId && zoneId === key) setData('highlightedZone', null)
      },
      drop: ({ setData, getData, event, attributes: { key } }) => {
        const drag = event as DragEvent
        drag.preventDefault()

        if (drag.dataTransfer) {
          const isHighlighted = getData('isHighlighted'),
            highlightedZone = getData('highlightedZone')

          if (!isHighlighted(highlightedZone, parseInt(key))) return

          setData('highlightedZone', null)

          const draggingId = parseInt(drag.dataTransfer.getData('text/plain')),
            droppedId = parseInt(key),
            droppedIndex = draggingId < droppedId ? droppedId - 1 : droppedId,
            users = getData('users'),
            user = users.find(({ id }) => id === draggingId)

          if (user)
            if (drag.altKey) setData('users', users.splice(droppedIndex, 0, user))
            else if (draggingId !== droppedIndex) {
              const newUsers = users.filter(user => user.id !== draggingId)
              newUsers.splice(droppedIndex, 0, user)
              setData('users', newUsers)
            }
        }
      }
    },
    'div[draggable="true"] > div:last-child': {
      click: [
        ({ setData, getData, attributes: { key } }) => {
          const userId = parseInt(key)
          setData('userId', getData('userId') === userId ? NaN : userId)
        },
        { throttle: 500, blur: true }
      ],
      dragstart: ({ setData, event, attributes: { key } }) => {
        const drag = event as DragEvent
        drag.preventDefault()

        if (drag.dataTransfer) {
          drag.dataTransfer.setData('text/plain', key)
          drag.dataTransfer.effectAllowed = 'copyMove'
          setData('draggingId', parseInt(key))
        }
      },
      dragover: [
        ({ setData, getData, event, attributes: { key } }) => {
          const drag = event as DragEvent
          drag.preventDefault()

          if (drag.dataTransfer) drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'

          const { target } = event

          if (target) {
            const draggingId = getData('draggingId'),
              { top, height } = (target as HTMLElement).getBoundingClientRect(),
              isAfter = drag.clientY > top + height / 2,
              index = parseInt(key),
              highlightedZone = getData('highlightedZone')

            if (
              !drag.altKey &&
              ((index === draggingId - 1 && isAfter) ||
                (index === draggingId + 1 && !isAfter) ||
                index === draggingId)
            ) {
              if (highlightedZone) setData('highlightedZone', null)
              return
            }

            const targetElement = target as HTMLElement,
              getSiblingDropZone = (targetElement: HTMLElement) => {
                if (targetElement.getAttribute('draggable') === 'true') {
                  const sibling = targetElement[`${isAfter ? 'next' : 'previous'}ElementSibling`]

                  if (sibling && sibling.classList.contains('drop-zone')) return sibling
                } else if (targetElement.parentElement)
                  return getSiblingDropZone(targetElement.parentElement)
              },
              targetZone = getSiblingDropZone(targetElement)

            if (targetZone && highlightedZone !== targetZone)
              setData('highlightedZone', targetZone as HTMLElement)
          }
        },
        { throttle: 500 }
      ],
      dragend: ({ setData, getData }) => {
        setData('draggingId', NaN)
        if (getData('highlightedZone')) setData('highlightedZone', null)
      }
    }
  }
})
