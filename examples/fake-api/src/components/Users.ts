import { fics } from 'ficsjs'
import Button from '@/components/CrudButton'

interface User {
  id: number
  name: string
  email: string
}

const root = 'https://jsonplaceholder.typicode.com/users'
const users: User[] = await fetch(root).then(res => res.json())
const button = Button()
const headers: HeadersInit = { 'Content-type': 'application/json; charset=UTF-8' }

export default () =>
  fics<{ users: User[]; userId: number }, {}>({
    name: 'users',
    data: () => ({ users, userId: NaN }),
    props: [
      {
        descendant: button,
        values: ({ setData, crud }) => ({
          id: ({ getData }) => getData('userId'),
          deleteMethod:
            ({ getData }) =>
            async (id: number) => {
              await crud<User>(`${root}/${id}`, { method: 'DELETE', headers })
              setData(
                'users',
                getData('users').filter(user => user.id !== id)
              )
              setData('userId', NaN)
            },
          updateMethod:
            ({ getData }) =>
            async ({ id, name }: { id: number; name: string }, method: 'put' | 'patch') => {
              await crud<User>(`${root}/${id}`, {
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
    html: ({ data: { users, userId }, template, setProps }) => template`
      ${['put', 'patch', 'delete'].map(method => setProps(button, { method }))}
      ${users.map(user => {
        const textColor = `${userId === user.id ? 'text-red-700' : 'text-gray-900'}`
        const items = { id: 'Id', name: 'Name', email: 'Email' } as const
        const keys = Object.keys(items) as (keyof typeof items)[]

        return template`
          <div class="cursor-pointer" key="${user.id}" tabindex="0">
            ${keys.map(key => template`<p class="${textColor}">${items[key]}: ${user[key]}</p>`)}
          </div>
        `
      })}
    `,
    hooks: {
      mounted: async ({ setData, getData, crud }) =>
        setData('users', [
          ...getData('users'),
          await crud<User>(root, {
            method: 'POST',
            body: JSON.stringify(users[Math.floor(Math.random() * 10) + 1]),
            headers
          })
        ])
    },
    actions: {
      div: { click: ({ setData, attributes }) => setData('userId', parseInt(attributes.key)) }
    }
  })
