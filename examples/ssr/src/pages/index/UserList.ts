import { fics, type FiCs } from 'ficsjs'
import { goto, RpcError } from 'ficsjs/router'
import { api } from '@fics/routing/client'
import { color, flex, space, stroke, textSize } from 'ficsjs/style'
import Icon from '@/components/Icon'
import Link from '@/components/Link'
import { getUserPath, pages, paths } from '@/domain/path'
import { FAIL_USER, type User } from '@/domain/user'
import { SquarePen, Trash2 } from 'lucide-static'

interface Data {
  users: readonly User[]
}

const {
  NEW_USER: { name, href }
} = pages

const ITEMS = ['name', 'email', 'role'] as const
const LINKS = [
  { href, text: `${name} \u2192` },
  {
    href: `${paths.HOME}?${FAIL_USER}`,
    text: `Fail \u2192`,
    tooltip: 'Reproduces a 500 error triggered by the server layout.'
  }
]

const alertError = (error: unknown): void => {
  if (error instanceof RpcError && error.denied) return
  alert(error instanceof RpcError ? error.message : 'The request failed.')
}

const editUser = async ({ id }: User): Promise<void> => {
  try {
    await api.user(String(id)).authorizeUpdate()
    goto(getUserPath(id))
  } catch (error) {
    alertError(error)
  }
}

const removeUser = async (data: Data, { id, name }: User): Promise<void> => {
  try {
    await api.user(String(id)).authorizeRemove(undefined, { method: 'DELETE' })
    if (!confirm(`Delete ${name}?`)) return

    await api.user(String(id)).remove(undefined, { method: 'DELETE' })
    data.users = data.users.filter(user => user.id !== id)
  } catch (error) {
    alertError(error)
  }
}

const html: FiCs.Html<Data, {}> = ({
  data,
  children: { link, icon },
  template,
  attributes: {
    a11y: { srOnly }
  }
}) => template`
  <section>
    <div class="scroller">
      <table>
        <thead>
          <tr>
            ${ITEMS.map(item => template`<th scope="col">${item.charAt(0).toUpperCase() + item.slice(1)}</th>`)}
            <th scope="col"><span ${srOnly}>Actions</span></th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map(
            user => template`
              <tr key="${user.id}">
                ${ITEMS.map(item => template`<td>${user[item]}</td>`)}
                <td>
                  <div>
                    ${icon.setIndividualProps(`edit-${user.id}`, {
                      svg: SquarePen,
                      ariaLabel: `Edit ${user.name}`,
                      click: () => void editUser(user)
                    })}
                    ${icon.setIndividualProps(`delete-${user.id}`, {
                      svg: Trash2,
                      ariaLabel: `Delete ${user.name}`,
                      variant: 'danger',
                      click: () => void removeUser(data, user)
                    })}
                  </div>
                </td>
              </tr>
            `
          )}
        </tbody>
      </table>
    </div>
    ${LINKS.map((linkItem, index) => link.setIndividualProps(`link${index}`, linkItem))}
  </section>
`

const css: FiCs.Css<Data, {}> = `
  .scroller { 
    width: 100%; overflow-x: auto;

    table {
      width: min(100%, var(--chat-width));
      border-collapse: collapse;
      margin-block-end: ${space('md')};
      margin-inline: auto;

      th, td {
        ${textSize('md')}
        padding-block: ${space('xs')};
        padding-inline: ${space('sm')};
        border-block-end: ${stroke('sm')} solid ${color('divider')};
        text-align: start;
      }

      th { border-block-end-color: ${color('border')}; }

      td > div { ${flex({ center: 'y', gap: space('sm') })} justify-content: flex-end; }
    }
  }
`

export default fics<Data, {}>({
  name: 'user-list',
  children: [Link(), Icon()],
  data: () => ({ users: [] }),
  html,
  css
})
