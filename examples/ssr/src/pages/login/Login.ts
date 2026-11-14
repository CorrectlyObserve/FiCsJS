import { fics, type FiCs } from 'ficsjs'
import Button from '@/components/Button'
import Select from '@/components/Select'
import { readRedirect, viaLogin } from '@/domain/redirect'
import { ROLES } from '@/domain/role'

const props: FiCs.Props<{}, {}> = [
  {
    descendants: ({ children: { Select } }) => Select,
    values: () => ({
      id: 'role',
      label: 'Log in as',
      placeholder: 'Choose a role',
      options: ROLES.map(value => ({ value, text: value === 'admin' ? 'an admin' : 'a member' })),
      hint: 'An admin can add and delete users; a member has read-only access.',
      isRequired: true
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

const actions: FiCs.Actions<{}, {}> = {
  form: {
    submit: ({ event: { currentTarget }, submitForm }) =>
      submitForm(() => (currentTarget as HTMLFormElement).submit(), { shouldReportValidity: false })
  }
}

export default fics<{}, {}>({
  name: 'login',
  children: [Select(), Button()],
  props,
  html,
  actions,
  options: { ssr: false, form: { value: () => null } }
})
