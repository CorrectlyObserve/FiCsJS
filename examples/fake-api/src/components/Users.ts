import { fics } from 'ficsjs'
import Button from '@/components/Button'

interface User {
  id: string
  name: string
  email: string
}

const root = 'https://jsonplaceholder.typicode.com/users'
const users: User[] = await fetch(root).then(res => res.json())

export default () =>
  fics<{ users: User[]; selected: string }, {}>({
    name: 'users',
    data: () => ({ users, selected: '' }),
    html: ({ data: { users, selected }, template }) => template`
      ${users.map(user => {
        const textColor = `${selected === user.id.toString() ? 'text-red-700' : 'text-gray-900'}`
        const items = { id: 'Id', name: 'Name', email: 'Email' } as const
        const keys = Object.keys(items) as (keyof typeof items)[]

        return template`
          <div class="cursor-pointer" key="${user.id}" tabindex="0">
            ${keys.map(key => template`<p class="${textColor}">${items[key]}: ${user[key]}</p>`)}
          </div>
        `
      })}
    `,
    actions: { div: { click: ({ setData, attributes }) => setData('selected', attributes.key) } }
  })
