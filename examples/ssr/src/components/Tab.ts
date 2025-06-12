import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/materials/Button'

export default () =>
  fics({
    name: 'tab',
    children: [Button()],
    data: () => ({ tabs: [{ text: 'Chat' }, { query: '?tab=logs', text: 'Logs' }], path: '' }),
    html: ({ children: { button }, data: { tabs, path }, template, setData, setProps }) => template`
      <div class="buttons mb-7 gap-4">
        ${tabs.map(({ query, text }) => {
          const href = `/chat${query ?? ''}`

          return template`
            ${setProps(button, {
              isDisabled: href === path,
              text,
              click: () => {
                goto(href, { reload: true })
                setData('path', href)
              }
            })}
          `
        })}
      </div>
    `,
    css: { div: { '&.buttons': { ...flexCenter('x') } } },
    hooks: {
      created: ({ setData }) => {
        const { pathname, search } = window.location
        setData('path', `${pathname}${search}`)
      }
    },
    options: { ssr: false }
  })
