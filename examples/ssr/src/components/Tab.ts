import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/materials/Button'

export default fics({
  name: 'tab',
  children: [Button()],
  data: () => ({
    tabs: [
      { href: '/chat', text: 'Chat' },
      { href: '/chat/tab', text: 'Logs' }
    ],
    current: ''
  }),
  html: ({ children: { button }, data: { tabs, current }, template, setData }) => template`
    <div class="mb-7 gap-4">
      ${tabs.map(
        ({ href, text }) => template`
          ${button.setIndividualProps(text, {
            isDisabled: href === current,
            buttonText: text,
            click: () => {
              goto(href)
              setData('current', href)
            }
          })}
        `
      )}
    </div>
  `,
  css: { div: { ...flexCenter('x') } },
  hooks: { created: ({ setData }) => setData('current', window.location.pathname) },
  options: { ssr: false }
})
