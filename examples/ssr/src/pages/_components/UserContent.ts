import { fics } from 'ficsjs'
import { flexCenter } from 'ficsjs/style'
import type { User } from '@/types'
import { GripVertical } from 'lucide-static'

export default fics<{}, { user: User; userId: number; click: (userId: number) => void }>({
  name: 'user-content',
  attributes: ({
    props: {
      user: { id }
    }
  }) => ({ key: id.toString() }),
  html: ({ props: { user, userId }, template, html }) => {
    const { id } = user,
      textColor = id === userId ? 'text-pink' : 'text-white'

    return template`
      <div
        class="${textColor} p-3 cursor-grab"
        aria-label="Move the content with user ID:${id}"
        key="${id}-grid"
      >
        ${html(GripVertical)}
      </div>
      <div class="space-y-2" key="${id}-user">
        ${(['id', 'name', 'email'] as (keyof User)[]).map(
          key => template`
            <p class="text-base ${textColor}" key="${id}-${key}">
              ${key.charAt(0).toUpperCase() + key.slice(1)}: ${user[key]}
            </p>
          `
        )}
      </div>
    `
  },
  css: { ':host': flexCenter('y') },
  actions: {
    ':host': {
      click: [
        ({ props: { click }, attributes: { key } }) => click(parseInt(key)),
        { throttle: 500, blur: true }
      ]
    }
  }
})
