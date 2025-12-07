import { fics } from 'ficsjs'
import { flexCenter, oklch } from 'ficsjs/style'
import Button from '@/components/Button'
import { API_PATH, users } from '@/data/users'
import type { Method, User } from '@/types'
import { white } from '@/utils'
import { GripVertical } from 'lucide-static'

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' },
  USER_HEIGHT = '73.59px' as const

export default fics({
  name: 'users',
  children: [Button()],
  data: () => ({
    methods: ['PUT', 'PATCH', 'DELETE'] as Method[],
    users,
    userId: NaN,
    draggingIndex: NaN,
    highlightedZone: null as HTMLElement | null,
    isHighlighted: (highlightedZone: HTMLElement | null, zoneIndex: number) =>
      highlightedZone?.getAttribute('key') === zoneIndex.toString()
  }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({}) => ({ isDisabled: ({ getData }) => isNaN(getData('userId')) })
  },
  html: ({
    children: { button },
    data: { methods, users, userId, draggingIndex, highlightedZone, isHighlighted },
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
              await crud<User>(`${API_PATH}/${userId}`, options)
              setData(
                'users',
                users.filter(({ id }) => id !== userId)
              )
            } else {
              const name = prompt('Please enter a new user name.')
              if (name) {
                await crud<User>(`${API_PATH}/${userId}`, {
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
      <div class="drop-zone ${isHighlighted(highlightedZone, -1) ? 'dragged-over my-4 rounded-sm border border-dashed transition duration-200 ease-out' : 'h-4'}" key="-1"></div>
      ${users.map((user, index) => {
        const keys = ['id', 'name', 'email'] as const

        return template`
          <div
            class="${draggingIndex === index ? 'pointer-events-none' : ''}"
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
          <div class="drop-zone ${isHighlighted(highlightedZone, index) ? 'dragged-over my-4 rounded-sm border border-dashed transition duration-200 ease-out' : 'h-4'}" key="${index}"></div>
        `
      })}
    </div>
  `,
  css: {
    div: {
      '&.buttons': flexCenter('x'),
      '&.dragged-over': {
        height: USER_HEIGHT,
        background: white(0.05),
        borderColor: oklch('#4169e1')
      },
      '&.w-fit > div': flexCenter('y')
    }
  },
  hooks: {
    mounted: async ({ setData, getData, crud }) => {
      const users = getData('users')
      setData('users', [
        ...users,
        await crud<User>(API_PATH, {
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

        if (!drag.dataTransfer) return
        drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'
      },
      dragleave: ({ setData, getData, attributes: { key } }) => {
        const highlightedZone = getData('highlightedZone'),
          zoneIndex = highlightedZone?.getAttribute('key')

        if (zoneIndex && zoneIndex === key) setData('highlightedZone', null)
      },
      drop: ({ setData, getData, event, attributes: { key } }) => {
        const drag = event as DragEvent
        drag.preventDefault()
        if (!drag.dataTransfer) return

        const isHighlighted = getData('isHighlighted'),
          highlightedZone = getData('highlightedZone')

        let zoneIndex = parseInt(key)

        if (!isHighlighted(highlightedZone, zoneIndex)) return

        setData('highlightedZone', null)

        zoneIndex++

        const fromIndex = parseInt(drag.dataTransfer.getData('text/plain')),
          droppedIndex = fromIndex < zoneIndex ? zoneIndex - 1 : zoneIndex,
          users = getData('users') as User[],
          user = users[fromIndex]

        if (!user) return

        const isMoved = fromIndex !== droppedIndex

        if (drag.altKey || isMoved) {
          const newUsers = [...users]

          if (!drag.altKey && isMoved) newUsers.splice(fromIndex, 1)
          newUsers.splice(droppedIndex, 0, user)
          setData('users', newUsers)
        }
      }
    },
    'div[draggable="true"]': {
      dragstart: ({ setData, event, attributes: { key } }) => {
        const drag = event as DragEvent
        if (!drag.dataTransfer) return

        drag.dataTransfer.setData('text/plain', key)
        drag.dataTransfer.effectAllowed = 'copyMove'

        setData('draggingIndex', parseInt(key))
      },
      dragover: [
        ({ setData, getData, event, attributes: { key } }) => {
          const drag = event as DragEvent
          drag.preventDefault()
          if (!drag.dataTransfer) return

          drag.dataTransfer.dropEffect = drag.altKey ? 'copy' : 'move'

          const { target } = event
          if (!target) return

          const draggingIndex = getData('draggingIndex'),
            { top, height } = (target as HTMLElement).getBoundingClientRect(),
            isAfter = drag.clientY > top + height / 2,
            index = parseInt(key),
            highlightedZone = getData('highlightedZone')

          if (
            !drag.altKey &&
            ((index === draggingIndex - 1 && isAfter) ||
              (index === draggingIndex + 1 && !isAfter) ||
              index === draggingIndex)
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
        },
        { throttle: 500 }
      ],
      dragend: ({ setData, getData }) => {
        setData('draggingIndex', NaN)
        if (getData('highlightedZone')) setData('highlightedZone', null)
      }
    },
    'div[draggable="true"] > div:last-child': {
      click: [
        ({ setData, getData, attributes: { key } }) => {
          const userId = parseInt(key)
          setData('userId', getData('userId') === userId ? NaN : userId)
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
