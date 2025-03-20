import { fics } from 'ficsjs'
import css from '@/.tailwindcss.txt'

interface User {
  id: string
  name: string
  email: string
}

const root = 'https://jsonplaceholder.typicode.com/users'

export default () =>
  fics<{ users: User[] }, {}>({
    name: 'users',
    data: () => ({ users: [] }),
    fetch: async ({ crud }) => ({ users: await crud<Array<User>>(root) }),
    html: ({ data: { users }, template }) => template`
      ${users.map(
        ({ id, name, email }) => template`
          <div key="${id}">
            <p>Name: ${name}</p>
            <p>Email: ${email}</p>
          </div>
        `
      )}
    `,
    css: typeof window !== 'undefined' ? css : undefined
  })
