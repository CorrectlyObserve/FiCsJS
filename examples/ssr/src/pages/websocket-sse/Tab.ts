import { fics, type FiCs } from 'ficsjs'
import { goto } from 'ficsjs/router'
import Button from '@/components/Button'
import { CHAT_PATH } from '@/domain/path'

interface Data {
  tabs: { href: string; text: string }[]
  current: string
}

const html: FiCs.Html<Data, {}> = ({ children: { button }, data, template }) => template`
  <div class="flex justify-center mb-6 mx-auto gap-4">
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

const hooks: FiCs.Hooks<Data, {}> = {
  mounted: ({ data }) => (data.current = window.location.pathname)
}

export default fics({
  name: 'tab',
  children: [Button()],
  data: () => ({
    tabs: [
      { href: CHAT_PATH, text: 'Chat' },
      { href: `${CHAT_PATH}/activities`, text: 'Activities' },
      { href: `${CHAT_PATH}/stream`, text: 'Stream' }
    ],
    current: ''
  }),
  html,
  hooks
})
