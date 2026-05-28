import { fics, type FiCs } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { BASE_URL, getExpectedUser, USERS_KEY } from '@/data/users'
import Draggable from '@/pages/_components/Draggable'
import UserContent from '@/pages/_components/UserContent'
import type { Method, Updated, User } from '@/types'

interface Data {
  status: string
  methods: Method[]
  users: User[]
  userId: number
  draggingIndex: number
  highlightedZone: HTMLElement | null
  isHighlighted: (highlightedZone: HTMLElement | null, zoneIndex: number) => boolean
}

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

const props: FiCs.Props<Data, {}> = [
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
      onMove: ({ newArray }: Updated<User> & { newArray: User[] }) => {
        data.status = 'A user was moved.'
        queryCache.set<User[]>(USERS_KEY, newArray)
      },
      onCopy: ({ item: { id }, toIndex }: Updated<User>) => {
        const users = queryCache.get<User[]>(USERS_KEY) ?? data.users,
          newArray = [...users],
          expectedUser = getExpectedUser(users, id)

        newArray.splice(toIndex, 0, expectedUser)
        data.status = `A new user with ID ${expectedUser.id} was added.`

        void queryCache
          .optimisticUpdate<User[]>({
            key: USERS_KEY,
            newQuery: newArray,
            mutator: async () => {
              const createdUser = await crud<User>(BASE_URL, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(expectedUser)
                }),
                userWithExpectedId = { ...expectedUser, ...createdUser, id: expectedUser.id }

              return (queryCache.get<User[]>(USERS_KEY) ?? []).map(user =>
                user.id === expectedUser.id ? userWithExpectedId : user
              )
            }
          })
          .catch(() => {
            data.status = 'The new user could not be added.'
          })
      },
      selectItem: (user: User) => (data.userId = data.userId === user.id ? NaN : user.id)
    })
  },
  {
    descendant: ({ children: { userContent } }) => userContent,
    values: ({ data: { userId } }) => ({ userId })
  }
]

const html: FiCs.Html<Data, {}> = ({
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
                  mutator: async () => {
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
                    mutator: async () => {
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
}

const css: FiCs.Css<Data, {}> = ({ cssToString }) => `
  div {
    &.buttons {${cssToString(flexCenter('x'))}}
    &.w-fit {${cssToString(flexCenter('y'))}}
  }
`

const hooks: FiCs.Hooks<Data, {}> = {
  created: ({ data, queryCache, signal }) => {
    queryCache.bindTo({ key: USERS_KEY, data, dataKey: 'users', signal })
  },
  mounted: async ({ data, queryCache, crud, signal }) => {
    if (data.users.length === 0) return

    const users = queryCache.get<User[]>(USERS_KEY) ?? data.users,
      newUser = users[Math.floor(Math.random() * users.length)],
      expectedUser = getExpectedUser(users, newUser.id)

    await queryCache.optimisticUpdate<User[]>({
      key: USERS_KEY,
      newQuery: current => [...(current ?? []), expectedUser],
      mutator: async () => {
        const createdUser = await crud<User>(BASE_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(expectedUser)
          }),
          currentUsers = (queryCache.get<User[]>(USERS_KEY) ?? []).filter(
            ({ id }) => id !== expectedUser.id
          ),
          userWithExpectedId = { ...expectedUser, ...createdUser, id: expectedUser.id }

        return [...currentUsers, userWithExpectedId]
      },
      signal
    })
  }
}

export default fics({
  name: 'users',
  children: [Button(), Draggable<User>(), UserContent],
  data: () => ({
    status: '',
    methods: ['PUT', 'PATCH', 'DELETE'] as Method[],
    users: [],
    userId: NaN,
    draggingIndex: NaN,
    highlightedZone: null as HTMLElement | null,
    isHighlighted: (highlightedZone: HTMLElement | null, zoneIndex: number) =>
      highlightedZone?.getAttribute('key') === zoneIndex.toString()
  }),
  props,
  html,
  css,
  hooks
})
