import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'

export default () =>
  fics({
    name: 'tab',
    data: () => ({
      tabs: [
        { href: '/chat', text: 'Chat' },
        { href: '/chat?tab=logs', text: 'Logs' }
      ],
      currentPath: ''
    }),
    html: ({ data: { tabs }, template, setData, setProps }) => {
      const button = Button()
      const { pathname, search } = window.location
      const path = `${pathname}${search}`
      setData('currentPath', path)

      return template`
        <div class="buttons mb-7 gap-4">
          ${tabs.map(
            ({ href, text }) => template`
              ${setProps(button, {
                isDisabled: href === `${pathname}${search}`,
                text,
                click: () => {
                  goto(href, { reload: true })
                  setData('currentPath', href)
                }
              })}
            `
          )}
        </div>
      `
    },
    css: { div: { '&.buttons': { ...flexCenter('x') } } },
    options: { ssr: false }
  })
