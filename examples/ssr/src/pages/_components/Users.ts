import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import Draggable from '@/pages/_components/Draggable'
import UserContent from '@/pages/_components/UserContent'
import { BASE_URL, USERS_KEY } from '@/data/users'
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

          queryCache.set<User[]>(USERS_KEY, newArray)
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
                await queryCache.optimisticUpdate<User[]>({
                  key: USERS_KEY,
                  newQuery: current => (current ?? []).filter(({ id }) => id !== userId),
                  updater: async () => {
                    await crud<User>(`${BASE_URL}/${userId}`, options)
                    return queryCache.get<User[]>(USERS_KEY) ?? []
                  }
                })

                data.status = `The user with ID ${userId} was deleted.`
              } else {
                const name = prompt('Please enter a new user name.')

                if (name) {
                  await queryCache.optimisticUpdate<User[]>({
                    key: USERS_KEY,
                    newQuery: current =>
                      (current ?? []).map(user => (user.id === userId ? { ...user, name } : user)),
                    updater: async () => {
                      await crud<User>(`${BASE_URL}/${userId}`, {
                        ...options,
                        body: JSON.stringify({ id: userId, name })
                      })

                      return queryCache.get<User[]>(USERS_KEY) ?? []
                    }
                  })

                  data.status = `The user with ID ${userId} was updated.`
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
    mounted: async ({ data, queryCache, crud }) => {
      const cachedUsers = queryCache.getQuery<User[]>(['users'])

      if (cachedUsers === undefined) queryCache.setQuery(['users'], data.users)
      else data.users = cachedUsers

      if (data.users.length === 0) return

      const newUser = await crud<User>(BASE_URL, {
          method: 'POST',
          body: JSON.stringify(data.users[Math.floor(Math.random() * data.users.length)]),
          headers
        }),
        newUsers = [...data.users, newUser]

      data.users = newUsers
      queryCache.setQuery(['users'], newUsers)
    }
  }
})
