import { fics, type FiCs } from 'ficsjs'
import Icon from '@/components/Icon'
import { CHAT_PAGE, dark } from '@/utils'
import { MessageCircleMore } from 'lucide-static'

const props: FiCs.Props<{}, {}> = {
  descendant: ({ children: { icon } }) => icon,
  values: () => ({
    svg: MessageCircleMore,
    ariaLabel: 'Go to the chat page',
    isLarge: true,
    click: () => (window.location.href = CHAT_PAGE)
  })
}
const html: FiCs.Html<{}, {}> = ({ children: { icon }, template }) => template`${icon}`
const css: FiCs.Css<{}, {}> = `:host { background: ${dark()}; }`

export default fics({
  name: 'chat-button',
  className: 'fixed bottom-8 right-4',
  children: [Icon()],
  props,
  html,
  css
})
