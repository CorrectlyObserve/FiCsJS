import { fics, type FiCs, type QueryCache } from 'ficsjs'
import { goto, RpcError } from 'ficsjs/router'
import { color } from 'ficsjs/style'
import { api } from '@fics/routing/client'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Link from '@/components/Link'
import { pages, paths } from '@/domain/path'
import { type User, validateEmail, validateName } from '@/domain/user'

interface Status {
  notice: string
  phase: 'idle' | 'submitting' | 'error' | 'success'
}

interface Data {
  readonly user: User | null
  readonly isSelf: boolean
  draft: User | null
  status: Status
  method: 'PUT' | 'PATCH'
}

const USER_KEY = ['user'] as const
const STATUS_KEY = ['user-status'] as const
const {
  USERS: { href, name }
} = pages

const props: FiCs.Props<Data, {}> = [
  { descendants: ({ children: { input } }) => input, values: () => ({ isRequired: true }) },
  {
    descendants: ({ children: { link } }) => link,
    values: () => ({ href, text: `\u2190 Back to ${name}` })
  }
]

const resolveUser = ({ user, draft }: { user: User | null; draft: User | null }): User | null => {
  if (!user) return null

  if (user.id === draft?.id) return draft
  return user
}

const removeUser = async (user: User, queryCache: Pick<QueryCache, 'set'>): Promise<void> => {
  queryCache.set<Status>(STATUS_KEY, { notice: 'Deleting…', phase: 'submitting' })

  try {
    await api.user(String(user.id)).remove(undefined, { method: 'DELETE' })
    goto(paths.HOME)
  } catch (error) {
    queryCache.set<Status>(STATUS_KEY, {
      notice: error instanceof RpcError ? error.message : 'The delete failed.',
      phase: 'error'
    })
  }
}

const html: FiCs.Html<Data, {}> = ({
  data,
  children: { input, link, button },
  queryCache,
  template
}) => {
  const {
    user,
    isSelf,
    draft,
    status: { notice, phase }
  } = data
  const resolvedUser: User | null = resolveUser({ user, draft })
  if (!resolvedUser) return template`<section></section>`

  return template`
    <form novalidate>
      <fieldset ${phase === 'submitting' && 'disabled'}>
        ${input.setIndividualProps('name', {
          id: 'name',
          label: 'Name',
          placeholder: 'Sample Name',
          value: resolvedUser.name,
          hint: 'Enter <strong>`expose test`</strong> to simulate a secure internal server error.',
          autocomplete: isSelf ? 'name' : 'off',
          validate: validateName
        })}
        ${input.setIndividualProps('email', {
          id: 'email',
          label: 'Email',
          placeholder: 'sample@example.com',
          type: 'email',
          value: resolvedUser.email,
          autocomplete: isSelf ? 'email' : 'off',
          validate: validateEmail
        })}
        <div>
          ${(['PUT', 'PATCH'] as Data['method'][]).map(method =>
            button.setIndividualProps(method.toLowerCase(), {
              text: `Save (${method})`,
              tooltip: method === 'PUT' ? 'Save all changes' : 'Save the name only',
              isFull: true,
              click: () => (data.method = method)
            })
          )}
        </div>
        ${notice !== '' && template`<p role="status">${notice}</p>`}
      </fieldset>
      ${button.setIndividualProps('delete', {
        text: 'Delete this user',
        isNotInForm: true,
        variant: 'danger',
        click: () => void removeUser(resolvedUser, queryCache)
      })}
      ${link}
    </form>
  `
}

const css: FiCs.Css<Data, {}> = ({
  data: {
    status: { phase }
  }
}) => `p { text-align: center; ${(phase === 'error' && `color: ${color('text', 'danger')}`) || ''}; }`

const hooks: FiCs.Hooks<Data, {}> = {
  created: ({ data, queryCache, signal }) => {
    queryCache.bindTo({ key: USER_KEY, data, dataKey: 'draft', signal })
    queryCache.bindTo({ key: STATUS_KEY, data, dataKey: 'status', signal })
  },
  mounted: ({ data: { user }, queryCache }) => {
    if (user) queryCache.set<User>(USER_KEY, user)
  }
}

const actions: FiCs.Actions<Data, {}> = {
  form: {
    submit: async ({
      event,
      data: {
        user,
        draft,
        status: { phase },
        method
      },
      submitForm,
      queryCache
    }): Promise<void> => {
      event.preventDefault()

      const resolvedUser: User | null = resolveUser({ user, draft })
      if (!resolvedUser || phase === 'submitting') return

      submitForm(
        async ({ name, email }: { name: string; email: string }) => {
          const patch: Partial<Omit<User, 'id'>> = {
            name,
            ...(method === 'PUT' ? { email } : {})
          }

          queryCache.set<Status>(STATUS_KEY, { notice: 'Saving…', phase: 'submitting' })

          try {
            await queryCache.optimisticUpdate<User>({
              key: USER_KEY,
              newQuery: { ...resolvedUser, ...patch },
              idempotent: method === 'PUT',
              mutator: async (): Promise<User> =>
                api.user(String(resolvedUser.id)).update(patch, { method })
            })

            queryCache.set<Status>(STATUS_KEY, {
              notice: `Saved with ${method}.`,
              phase: 'success'
            })
          } catch (error) {
            queryCache.set<Status>(STATUS_KEY, {
              notice: error instanceof RpcError ? error.message : 'The user could not be saved.',
              phase: 'error'
            })
          }
        },
        { shouldReportValidity: false }
      )
    }
  }
}

export default fics<Data, {}>({
  name: 'user-details',
  children: [Input(), Button(), Link()],
  data: () => ({
    user: null,
    isSelf: false,
    draft: null,
    status: { notice: '', phase: 'idle' },
    method: 'PUT'
  }),
  props,
  html,
  css,
  hooks,
  actions,
  options: { form: { value: () => null } }
})
