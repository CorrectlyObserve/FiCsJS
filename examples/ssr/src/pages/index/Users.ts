import { fics, type FiCs } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import { api } from '@fics/routing/client'
import Button from '@/components/Button'
import Draggable from '@/pages/index/Draggable'
import UserContent from '@/pages/index/UserContent'
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

const getExpectedUser = (users: readonly User[], userId: User['id']): User => {
  let targetUser: User | undefined,
    maxId = 0

  for (const user of users) {
    const { id } = user

    if (id === userId) targetUser = user
    if (id > maxId) maxId = id
  }

  if (!targetUser) throw new Error(`The user with ID ${userId} does not exist.`)
  return { ...targetUser, id: maxId + 1 }
}

export const USERS_KEY = ['users'] as const

const props: FiCs.Props<Data, {}> = [
  {
    descendants: ({ children: { draggable, button } }) => [draggable.getChildren().menu, button],
    values: ({ data: { userId } }) => ({ isDisabled: !Number.isInteger(userId) })
  },
  {
    descendants: ({ children: { draggable } }) => draggable,
    values: ({ data, children: { userContent }, queryCache }) => ({
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
              const createdUser = await api.create({
                name: expectedUser.name,
                email: expectedUser.email
              })

              return (queryCache.get<User[]>(USERS_KEY) ?? []).map(user =>
                user.id === expectedUser.id ? createdUser : user
              )
            }
          })
          .catch(() => {
            data.status = 'The new user could not be added.'
          })
      },
      selectItem: (user: User) => {
        const nextId: number = data.userId === user.id ? NaN : user.id
        data.userId = nextId

        if (Number.isInteger(nextId))
          void api(nextId.toString())
            .get(undefined, { method: 'GET' })
            .then(({ name, email }) => {
              data.status = `Loaded ${name} <${email}> via GET method.`
            })
      }
    })
  },
  {
    descendants: ({ children: { userContent } }) => userContent,
    values: ({ data: { userId } }) => ({ userId })
  }
]

const html: FiCs.Html<Data, {}> = ({
  children: { button, draggable },
  data,
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
                  idempotent: true,
                  mutator: async () => {
                    await api(userId.toString()).remove(undefined, { method: 'DELETE' })
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

                  try {
                    await queryCache.optimisticUpdate<User[]>({
                      key: USERS_KEY,
                      newQuery: current =>
                        (current ?? []).map(user =>
                          user.id === userId ? { ...user, name } : user
                        ),
                      idempotent: method === 'PUT',
                      mutator: async () => {
                        const updatedUser = await api(userId.toString()).update(
                          method === 'PUT' ? { name, email: currentUser.email } : { name },
                          { method }
                        )

                        return (queryCache.get<User[]>(USERS_KEY) ?? []).map(user =>
                          user.id === userId ? updatedUser : user
                        )
                      }
                    })

                    data.status = `The user with ID ${userId} was updated.`
                  } catch (error) {
                    data.status = error instanceof Error ? error.message : 'The update failed.'
                  }
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
  mounted: async ({ data, queryCache, signal }) => {
    if (data.users.length === 0) return

    const users = queryCache.get<User[]>(USERS_KEY) ?? data.users,
      newUser = users[Math.floor(Math.random() * users.length)],
      expectedUser = getExpectedUser(users, newUser.id)

    await queryCache.optimisticUpdate<User[]>({
      key: USERS_KEY,
      newQuery: current => [...(current ?? []), expectedUser],
      mutator: async () => {
        const createdUser = await api.create(
            { name: expectedUser.name, email: expectedUser.email },
            { signal }
          ),
          currentUsers = (queryCache.get<User[]>(USERS_KEY) ?? []).filter(
            ({ id }) => id !== expectedUser.id
          )

        return [...currentUsers, createdUser]
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
