import { fics, type FiCs } from 'ficsjs'
import { goto, RpcError } from 'ficsjs/router'
import { api } from '@fics/routing/client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Link from '@/components/Link'
import Select from '@/components/Select'
import { pages, paths } from '@/domain/path'
import { ROLES } from '@/domain/role'
import { type User, normalizeEmail, validateEmail, validateName } from '@/domain/user'

interface Data {
  status: { notice: string; phase: 'idle' | 'submitting' | 'error' }
  takenEmail: string
}

const {
  USERS: { href, name }
} = pages

const props: FiCs.Props<Data, {}> = [
  { descendants: ({ children: { Input } }) => Input, values: () => ({ isRequired: true }) },
  {
    descendants: ({ children: { Select } }) => Select,
    values: () => ({
      id: 'role',
      label: 'Role',
      placeholder: 'Choose a role',
      options: ROLES.map(role => ({ value: role, text: role })),
      isRequired: true
    })
  },
  { descendants: ({ children: { Button } }) => Button, values: () => ({ text: 'Add user' }) },
  {
    descendants: ({ children: { Link } }) => Link,
    values: () => ({ href, text: `\u2190 Back to ${name}` })
  }
]

const html: FiCs.Html<Data, {}> = ({
  data: {
    status: { notice, phase },
    takenEmail
  },
  children: { Input, Select, Link, Button },
  template,
  attributes: { disabled }
}) => template`
  <form novalidate>
    <fieldset ${disabled(phase === 'submitting')}>
      ${Input.setIndividualProps('name', {
        id: 'name',
        label: 'Name',
        placeholder: 'Sample Name',
        validate: validateName
      })}
      ${Input.setIndividualProps('email', {
        id: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'sample@example.com',
        validate: (value: string) =>
          validateEmail(value) ??
          (normalizeEmail(value) === takenEmail
            ? 'That email address already belongs to someone.'
            : null)
      })}
      ${Select}
      <div>${Button}</div>  
      ${notice !== '' && template`<p role="status">${notice}</p>`}
    </fieldset>
    ${Link}
  </form>
`

const actions: FiCs.Actions<Data, {}> = {
  form: {
    submit: async ({ data, event, submitForm }): Promise<void> => {
      if (data.status.phase === 'submitting') {
        event.preventDefault()
        return
      }

      submitForm(
        async ({ name, email, role }: Omit<User, 'id'>) => {
          data.status = { notice: 'Submitting…', phase: 'submitting' }

          try {
            await api.user.new.create({ name, email, role })
            goto(paths.HOME)
          } catch (error) {
            if (error instanceof RpcError && error.code === 'CONFLICT') {
              data.takenEmail = normalizeEmail(email) ?? ''
              data.status = { notice: '', phase: 'idle' }
              return
            }

            data.status = {
              notice: error instanceof RpcError ? error.message : 'The user could not be added.',
              phase: 'error'
            }
          }
        },
        { shouldReportValidity: false }
      )
    }
  }
}

export default fics<Data, {}>({
  name: 'add-user',
  children: [Input(), Select(), Button(), Link()],
  data: () => ({ status: { notice: '', phase: 'idle' }, takenEmail: '' }),
  props,
  html,
  actions,
  options: { form: { value: () => null } }
})
