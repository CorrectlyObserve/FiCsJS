import { fics, type FiCs } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter } from 'ficsjs/style'
import Button from '@/components/Button'
import { CHAT_PAGE } from '@/utils'

interface Data {
  tabs: { href: string; text: string }[]
  current: string
}

const html: FiCs.Html<Data, {}> = ({ children: { button }, data, template }) => template`
  <div class="container mb-6 mx-auto gap-4">
    ${data.tabs.map(
      ({ href, text }, index) => template`
        ${button.setIndividualProps(index, {
          isDisabled: data.current === '' || data.current === href,
          isCurrent: data.current === href,
          buttonText: text,
          click: () => {
            goto(href)
            data.current = href
          }
        })}
      `
    )}
  </div>
`

const css: FiCs.Css<Data, {}> = `:host div.container {${flexCenter('x')}}`

const hooks: FiCs.Hooks<Data, {}> = {
  mounted: ({ data }) => (data.current = window.location.pathname)
}

export default fics({
  name: 'tab',
  children: [Button()],
  data: () => ({
    tabs: [
      { href: CHAT_PAGE, text: 'Chat' },
      { href: `${CHAT_PAGE}/activities`, text: 'Activities' },
      { href: `${CHAT_PAGE}/stream`, text: 'Stream' }
    ],
    current: ''
  }),
  html,
  css,
  hooks
})
