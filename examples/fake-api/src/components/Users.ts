import { fics } from 'ficsjs'

interface User {
  id: string
  name: string
  email: string
}

const root = 'https://jsonplaceholder.typicode.com/users'
const users: User[] = await fetch(root)
  .then(res => res.json())
  .then(json => json)

export default () =>
  fics<{ users: User[]; selected: String }, {}>({
    name: 'users',
    data: () => ({ users, selected: '' }),
    html: ({ data: { users, selected }, template }) => template`
      ${users.map(({ id, name, email }) => {
        const textColor = `${selected === id.toString() ? 'text-red-700' : 'text-gray-900'}`
        const labels = ['Name', 'Email']

        return template`
          <div class="cursor-pointer" key="${id}" tabindex="0">
            ${[name, email].map(
              (value, index) => template`<p class="${textColor}">${labels[index]}: ${value}</p>`
            )}
          </div>
        `
      })}
    `,
    actions: { div: { click: ({ setData, attributes }) => setData('selected', attributes.key) } }
  })
