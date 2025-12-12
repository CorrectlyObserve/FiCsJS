import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import Draggable from '@/pages/_components/Draggable'
import UserContent from '@/pages/_components/UserContent'
import { API_PATH, users } from '@/data/users'
import type { Method, User } from '@/types'

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default fics({
  name: 'users',
  children: [Button(), Draggable<User>(), UserContent],
  data: () => ({
    methods: ['PUT', 'PATCH', 'DELETE'] as Method[],
    users,
    userId: NaN,
    draggingIndex: NaN,
    highlightedZone: null as HTMLElement | null,
    isHighlighted: (highlightedZone: HTMLElement | null, zoneIndex: number) =>
      highlightedZone?.getAttribute('key') === zoneIndex.toString()
  }),
  props: [
    {
      descendant: ({ children: { button } }) => button,
      values: () => ({ isDisabled: ({ getData }) => isNaN(getData('userId')) })
    },
    {
      descendant: ({ children: { draggable } }) => draggable,
      values: ({ children: { userContent }, crud, setData }) => ({
        array: ({ getData }) => getData('users'),
        slot: (user: User, index: number) => userContent.setIndividualProps(index, { user }),
        getNewItem:
          ({ getData }) =>
          async (user: User) => {
            const newUser = await crud<User>(API_PATH, {
                method: 'POST',
                body: JSON.stringify(user),
                headers
              }),
              maxId = getData('users').reduce((max, { id }) => (id > max ? id : max), 0)

            return { ...newUser, id: maxId + 1 }
          },
        updateArray: (newArray: User[]) => setData('users', newArray)
      })
    },
    {
      descendant: ({ children: { userContent } }) => userContent,
      values: ({ setData }) => ({
        userId: ({ getData }) => getData('userId'),
        click:
          ({ getData }) =>
          (userId: number) =>
            setData('userId', getData('userId') === userId ? NaN : userId)
      })
    }
  ],
  html: ({
    children: { button, draggable },
    data: { methods, users, userId },
    setData,
    crud,
    template
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
    <div class="w-fit mx-auto">${draggable}</div>
  `,
  css: { div: { '&.buttons': flexCenter('x'), '&.w-fit': flexCenter('y') } },
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
  }
})
