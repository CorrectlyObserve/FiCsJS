import { fics, type FiCs } from 'ficsjs'
import Button from '@/components/Button'
import Select from '@/components/Select'
import { readRedirect, viaLogin } from '@/domain/redirect'
import { isRole, ROLES, type Role } from '@/domain/role'

interface Data {
  role: Role | ''
}

const props: FiCs.Props<Data, {}> = [
  {
    descendants: ({ children: { Select } }) => Select,
    values: () => ({
      id: 'role',
      label: 'Log in as',
      placeholder: 'Choose a role',
      options: ROLES.map(value => ({ value, text: value === 'admin' ? 'an admin' : 'a member' })),
      hint: 'An admin can add and delete users; a member has read-only access.',
      isRequired: true,
      change: (value: string) => (data.role = isRole(value) ? value : '')
    })
  },
  { descendants: ({ children: { Button } }) => Button, values: () => ({ text: 'Log in' }) }
]

const html: FiCs.Html<{}, {}> = ({ children: { Select, Button }, template, isBrowser }) => template`
  <form
    method="post"
    novalidate
    action="${viaLogin(isBrowser ? readRedirect(window.location.href) : null)}"
  >
    ${Select}
    ${Button}
  </form>
`

export default fics<Data, {}>({
  name: 'login',
  children: [Select(), Button()],
  data: () => ({ role: '' }),
  props,
  html,
  options: { ssr: false }
})
