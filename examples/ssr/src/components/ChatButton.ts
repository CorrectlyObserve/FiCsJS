import { fics } from 'ficsjs'
import Icon from '@/components/Icon'
import { CHAT_PAGE, dark } from '@/utils'
import { MessageCircleMore } from 'lucide-static'

export default () =>
  fics({
    name: 'chat-button',
    className: 'fixed bottom-8 right-4',
    children: [Icon()],
    props: {
      descendant: ({ children: { icon } }) => icon,
      values: () => ({
        svg: MessageCircleMore,
        ariaLabel: 'Go to the chat page',
        isLarge: true,
        click: () => (window.location.href = CHAT_PAGE)
      })
    },
    html: ({ children: { icon }, template }) => template`${icon}`,
    css: `:host { background: ${dark()}; }`
  })
