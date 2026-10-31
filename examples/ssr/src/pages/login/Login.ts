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
    descendants: ({ children: { select } }) => select,
    values: ({ data }) => ({
      id: 'role', 
      label: 'Log in as',
      placeholder: 'Choose a role',
      options: ROLES.map(value => ({ value, text: value === 'admin' ? 'an admin' : 'a member' })),
      hint: 'An admin can add and delete users; a member has read-only access.',
      isRequired: true,
      change: (value: string) => (data.role = isRole(value) ? value : '')
    })
  },
  {
    descendants: ({ children: { button } }) => button,
    values: ({ data: { role } }) => ({ text: 'Log in', isDisabled: role === '' })
  }
]

const html: FiCs.Html<Data, {}> = ({
  children: { select, button },
  template,
  isBrowser
}) => template`
  <form
    method="post"
    novalidate
    action="${viaLogin(isBrowser ? readRedirect(window.location.href) : null)}"
  >
    ${select}
    ${button}
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
