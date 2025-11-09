import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { api, users } from '@/data/users'
import type { Method, User } from '@/types'

const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default fics({
  name: 'users',
  children: [Button()],
  data: () => ({ users, userId: NaN, methods: ['PUT', 'PATCH', 'DELETE'] as Method[] }),
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({}) => ({ isDisabled: ({ getData }) => isNaN(getData('userId')) })
  },
  html: ({
    children: { button },
    data: { users, userId, methods },
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
    <div class="space-y-4">
      ${users.map(user => {
        const { id } = user,
          keys = ['id', 'name', 'email'] as const

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
  css: { div: { '&.buttons': flexCenter('x'), '&.space-y-4': flexCenter('x', 'column') } },
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
