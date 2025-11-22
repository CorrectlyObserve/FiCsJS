import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { CHAT_PAGE } from '@/utils'

export default fics({
  name: 'tab',
  children: [Button()],
  data: () => ({
    tabs: [
      { href: CHAT_PAGE, text: 'Chat' },
      { href: `${CHAT_PAGE}/logs`, text: 'Logs' },
      { href: `${CHAT_PAGE}/stream`, text: 'Stream' }
    ],
    current: ''
  }),
  html: ({ children: { button }, data: { tabs, current }, template, setData }) => template`
    <div class="container mb-6 mx-auto gap-4">
      ${tabs.map(
        ({ href, text }, index) => template`
          ${button.setIndividualProps(index, {
            isDisabled: current === '' || current === href,
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
  css: { ':host div.container': flexCenter('x') },
  hooks: { mounted: ({ setData }) => setData('current', window.location.pathname) }
})
