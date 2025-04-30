import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/CrudButton'
import { api, users } from '@/data/users'
import type { User } from '@/types'

const button = Button()
const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default () =>
  fics({
    name: 'users',
    data: () => ({ users, userId: NaN, methods: ['put', 'patch', 'delete'] }),
    props: [
      {
        descendant: button,
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
      <div class="my-4 gap-4">${methods.map(method => setProps(button, { method }))}</div>
      <div class="space-y-4">
        ${users.map(user => {
          const textColor = `${userId === user.id ? 'text-red' : 'text-white'}`
          const items = { id: 'Id', name: 'Name', email: 'Email' } as const
          const keys = Object.keys(items) as (keyof typeof items)[]

          return template`
            <div class="clickable w-3xs space-y-2 mx-auto" key="${user.id}" tabindex="0">
              ${keys.map(
                key => template`
                <p class="text-base ${textColor}" key="${user.id}-${key}">${items[key]}: ${user[key]}</p>`
              )}
            </div>
          `
        })}
      </div>
    `,
    css: [
      { div: { '&.my-4': { ...flexCenter('x') }, '&.space-y-4': { ...flexCenter('x', 'column') } } }
    ],
    hooks: {
      mounted: async ({ setData, getData, crud }) => {
        const users = getData('users')
        setData('users', [
          ...users,
          await crud<User>(api, {
            method: 'POST',
            body: JSON.stringify(users[Math.floor(Math.random() * 10)]),
            headers
          })
        ])
      }
    },
    actions: {
      'div > div': {
        click: [
          ({ setData, getData, attributes }) => {
            const userId = parseInt(attributes.key)
            setData('userId', getData('userId') === userId ? NaN : userId)
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
