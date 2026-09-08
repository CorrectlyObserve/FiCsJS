import { fics, type FiCs } from 'ficsjs'
import type { User } from '@/server/users'

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
            <span
              class="[grid-area:1/1] invisible select-none pointer-events-none font-semibold"
              aria-hidden="true"
            >${line}</span>
            <span class="[grid-area:1/1] ${isSelected ? 'font-semibold' : 'font-normal'}">
              ${line}
            </span>
          </p>
        `
      })}
    </div>
  `
}

export default fics<{}, Props>({ name: 'user-content', className: 'flex items-center', html })
