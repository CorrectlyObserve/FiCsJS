import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import Draggable from '@/pages/_components/Draggable'
import UserContent from '@/pages/_components/UserContent'
import { BASE_URL, getExpectedUser, USERS_KEY } from '@/data/users'
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
        getNewItem: (user: User) =>
          getExpectedUser(queryCache.get<User[]>(USERS_KEY) ?? data.users, user.id),
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
              if (method === 'DELETE') {
                const filteredUsers = (users: User[]) => users.filter(({ id }) => id !== userId)

                await queryCache.optimisticUpdate<User[]>({
                  key: USERS_KEY,
                  newQuery: current => filteredUsers(current ?? []),
                  updater: async () => {
                    await crud<User>(`${BASE_URL}/${userId}`, { method, headers })
                    return filteredUsers(queryCache.get<User[]>(USERS_KEY) ?? [])
                  }
                })

                data.status = `The user with ID ${userId} was deleted.`
              } else {
                const name = prompt('Please enter a new user name.')

                if (name) {
                  const currentUser = (queryCache.get<User[]>(USERS_KEY) ?? data.users).find(
                    ({ id }) => id === userId
                  )

                  if (!currentUser) {
                    data.userId = NaN
                    return
                  }

                  await queryCache.optimisticUpdate<User[]>({
                    key: USERS_KEY,
                    newQuery: current =>
                      (current ?? []).map(user => (user.id === userId ? { ...user, name } : user)),
                    updater: async () => {
                      const createdUser = await crud<User>(`${BASE_URL}/${userId}`, {
                        method,
                        headers,
                        body: JSON.stringify(
                          method === 'PUT' ? { ...currentUser, name } : { id: userId, name }
                        )
                      })

                      return (queryCache.get<User[]>(USERS_KEY) ?? []).map(user => {
                        if (user.id === userId)
                          return method === 'PUT' ? createdUser : { ...user, ...createdUser }

                        return user
                      })
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
    created: ({ data, queryCache, signal }) => {
      queryCache.bindData({ key: USERS_KEY, data, dataKey: 'users', signal })
    },
    mounted: async ({ data, queryCache, crud, signal }) => {
      if (data.users.length === 0) return

      const users = queryCache.get<User[]>(USERS_KEY) ?? data.users,
        newUser = users[Math.floor(Math.random() * users.length)],
        expectedUser = getExpectedUser(users, newUser.id)

      await queryCache.optimisticUpdate<User[]>({
        key: USERS_KEY,
        newQuery: current => [...(current ?? []), expectedUser],
        updater: async () => {
          const createdUser = await crud<User>(BASE_URL, {
              method: 'POST',
              headers,
              body: JSON.stringify(expectedUser)
            }),
            currentUsers = (queryCache.get<User[]>(USERS_KEY) ?? []).filter(
              ({ id }) => id !== expectedUser.id
            )

          return [...currentUsers, { ...expectedUser, ...createdUser }]
        },
        signal
      })
    }
  }
})
