import { fics, type FiCs } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import type { User } from '@/types'

interface Props {
  user: User
  userId: number
}

const html: FiCs.Html<{}, Props> = ({ props: { user, userId }, template }) => {
  const { id } = user,
    isSelected = userId === id

  return template`
    <div class="space-y-2 px-3" key="${id}">
      ${(['id', 'name', 'email'] as const).map(key => {
        const line = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${user[key]}`

        return template`
          <p class="grid text-base ${isSelected ? 'text-pink' : 'text-white'}" key="${id}-${key}">
            <span class="invisible select-none pointer-events-none font-semibold" aria-hidden="true">
              ${line}
            </span>
            <span class="${isSelected ? 'font-semibold' : 'font-normal'}">${line}</span>
          </p>
        `
      })}
    </div>
  `
}

const css: FiCs.Css<{}, Props> = ({ cssToString }) => `
  :host {
    ${cssToString(flexCenter('y'))}

    p > span { grid-area: 1/1; }
  }
`

export default fics<{}, Props>({ name: 'user-content', html, css })
