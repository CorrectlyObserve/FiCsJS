import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import CrudButton from '@/components/CrudButton'
import { api, users } from '@/data/users'
import type { User } from '@/types'

const crudButton = CrudButton()
const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default () =>
  fics({
    name: 'users',
    data: () => ({ users, userId: NaN, methods: ['put', 'patch', 'delete'] }),
    props: [
      {
        descendant: crudButton,
        values: ({ setData, crud }) => ({
          id: ({ getData }) => getData('userId'),
          deleteMethod:
            ({ getData }) =>
            async (id: number) => {
              await crud<User>(`${api}/${id}`, { method: 'DELETE', headers })
              setData(
                'users',
                getData('users').filter(user => user.id !== id)
              )
              setData('userId', NaN)
            },
          updateMethod:
            ({ getData }) =>
            async ({ id, name }: { id: number; name: string }, method: 'put' | 'patch') => {
              await crud<User>(`${api}/${id}`, {
                method: method.toUpperCase(),
                body: JSON.stringify({ id, name }),
                headers
              })
              setData(
                'users',
                getData('users').map(user => (user.id === id ? { ...user, name } : user))
              )
              setData('userId', NaN)
            }
        })
      }
    ],
    html: ({ data: { users, userId, methods }, template, setProps }) => template`
      <div class="buttons mb-7 gap-4">${methods.map(method => setProps(crudButton, { method }))}</div>
      <div class="space-y-4">
        ${users.map(user => {
          const { id } = user
          const keys: (keyof User)[] = ['id', 'name', 'email']

          return template`
            <div class="clickable w-3xs space-y-2 mx-auto" key="${id}" tabindex="0">
              ${keys.map((key, index) => {
                const _key = keys[index]
                return template`
                    <p class="text-base ${userId === id ? 'text-red' : 'text-white'}" key="${id}-${key}">
                      ${_key.charAt(0).toUpperCase() + _key.slice(1)}: ${user[key]}
                    </p>
                  `
              })}
            </div>
          `
        })}
      </div>
    `,
    css: {
      div: { '&.buttons': { ...flexCenter('x') }, '&.space-y-4': { ...flexCenter('x', 'column') } }
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
      'div > div': {
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
