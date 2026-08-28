import { fics, type FiCs } from 'ficsjs'
import { size } from 'ficsjs/style'
import Button from '@/components/Button'
import Select from '@/components/Select'
import { isRole, ROLES, type Role } from '@/domain/role'

interface Data {
  role: Role | ''
}

const props: FiCs.Props<Data, {}> = [
  {
    descendants: ({ children: { select } }) => select,
    values: ({ data }) => ({
      label: 'Log in as',
      name: 'role',
      options: ROLES.map(value => ({
        value,
        text: { admin: 'an admin', member: 'a member' }[value]
      })),
      value: data.role,
      change: (value: string) => (data.role = isRole(value) ? value : ''),
      placeholder: 'Choose a role',
      description: 'An admin can add and delete users; a member has read-only access.',
      isRequired: true
    })
  },
  {
    descendants: ({ children: { button } }) => button,
    values: ({ data: { role } }) => ({ text: 'Log in', isDisabled: role === '' })
  }
]

const html: FiCs.Html<Data, {}> = ({ children: { select, button }, template }) => template`
  <form method="post" action="/login">${select}${button}</form>
`
const css: FiCs.Css<Data, {}> = `form { display: grid; justify-items: center; gap: ${size(4)}; }`

export default fics<Data, {}>({
  name: 'login',
  children: [Select(), Button()],
  data: () => ({ role: '' }),
  props,
  html,
  css,
  options: { ssr: false }
})
