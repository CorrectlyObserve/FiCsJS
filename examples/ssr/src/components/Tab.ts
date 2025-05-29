import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/materials/Button'

export default () =>
  fics({
    name: 'tab',
    data: () => ({
      tabs: [{ text: 'Chat' }, { query: '?tab=logs', text: 'Logs' }],
      currentPath: ''
    }),
    html: ({ data: { tabs }, template, setData, setProps }) => {
      const button = Button()
      const { pathname, search } = window.location
      const path = `${pathname}${search}`
      setData('currentPath', path)

      return template`
        <div class="buttons mb-7 gap-4">
          ${tabs.map(({ query, text }) => {
            const href = `/chat${query ?? ''}`

            return template`
              ${setProps(button, {
                isDisabled: href === path,
                text,
                click: () => {
                  goto(href, { reload: true })
                  setData('currentPath', href)
                }
              })}
            `
          })}
        </div>
      `
    },
    css: { div: { '&.buttons': { ...flexCenter('x') } } },
    options: { ssr: false }
  })
