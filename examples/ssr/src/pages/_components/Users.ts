import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import Draggable from '@/pages/_components/Draggable'
import UserContent from '@/pages/_components/UserContent'
import { BASE_URL } from '@/data/users'
import type { Method, User } from '@/types'

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default fics({
  name: 'users',
  children: [Button(), Draggable<User>(), UserContent],
  data: () => ({
    status: '',
    methods: ['PUT', 'PATCH', 'DELETE'] as Method[],
    users: [] as User[],
    userId: NaN,
    draggingIndex: NaN,
    highlightedZone: null as HTMLElement | null,
    isHighlighted: (highlightedZone: HTMLElement | null, zoneIndex: number) =>
      highlightedZone?.getAttribute('key') === zoneIndex.toString()
  }),
  props: [
    {
      descendant: ({ children: { button, draggable } }) => [button, draggable.getChildren().menu],
      values: ({ data: { userId } }) => ({ isDisabled: !Number.isInteger(userId) })
    },
    {
      descendant: ({ children: { draggable } }) => draggable,
      values: ({ data, children: { userContent }, crud, queryCache }) => ({
        array: data.users,
        slot: (user: User, index: number) => userContent.setIndividualProps(index, { user }),
        isSelected: (user: User) => data.userId === user.id,
        getNewItem: async (user: User) => {
          const newUser = await crud<User>(BASE_URL, {
              method: 'POST',
              body: JSON.stringify(user),
              headers
            }),
            maxId = data.users.reduce((max, { id }) => (id > max ? id : max), 0)

          return { ...newUser, id: maxId + 1 }
        },
        updateArray: (newArray: User[]) => {
          if (newArray.length >= data.users.length) {
            const userIds = new Set(data.users.map(({ id }) => id)),
              addedUser = newArray.find(({ id }) => !userIds.has(id))

            data.status = addedUser
              ? `A new user with ID ${addedUser.id} was added.`
              : 'A user was moved.'
          }

          data.users = newArray
          queryCache.setQuery(['users'], newArray)
        },
        selectItem: (user: User) => (data.userId = data.userId === user.id ? NaN : user.id)
      })
    },
    {
      descendant: ({ children: { userContent } }) => userContent,
      values: ({ data: { userId } }) => ({ userId })
    }
  ],
  html: ({
    children: { button, draggable },
    data,
    crud,
    queryCache,
    template,
    attributes: { statusLiveRegion }
  }) => {
    const { status, methods, userId } = data

    return template`
      <p class="sr-only" ${statusLiveRegion}>${status}</p>
      <div class="buttons mb-6 gap-4">
        ${methods.map((method, index) =>
          button.setIndividualProps(index, {
            buttonText: method,
            click: async () => {
              const options = { method, ...headers }

              if (method === 'DELETE') {
                await crud<User>(`${BASE_URL}/${userId}`, options)

                const newUsers = data.users.filter(({ id }) => id !== userId)

                data.users = newUsers
                data.status = `The user with ID ${userId} was deleted.`

                queryCache.setQuery(['users'], newUsers)
              } else {
                const name = prompt('Please enter a new user name.')
                if (name) {
                  await crud<User>(`${BASE_URL}/${userId}`, {
                    ...options,
                    body: JSON.stringify({ id: userId, name })
                  })

                  const newUsers = data.users.map(user =>
                    user.id === userId ? { ...user, name } : user
                  )

                  data.users = newUsers
                  data.status = `The user with ID ${userId} was updated.`

                  queryCache.setQuery(['users'], newUsers)
                }
              }

              data.userId = NaN
            }
          })
        )}
      </div>
      <div class="w-fit mx-auto">${draggable}</div>
    `
  },
  css: ({ cssToString }) => `
    div {
      &.buttons {${cssToString(flexCenter('x'))}}
      &.w-fit {${cssToString(flexCenter('y'))}}
    }
  `,
  hooks: {
    mounted: async ({ data, crud }) => {
      const { users } = data
      data.users = [
        ...users,
        await crud<User>(API_PATH, {
          method: 'POST',
          body: JSON.stringify(users[Math.floor(Math.random() * users.length)]),
          headers
        })
      ]
    }
  }
})
