import { fics } from 'ficsjs'
import { oklch } from 'ficsjs/style'
import Icon from '@/components/materials/Icon'
import { CHAT_PAGE } from '@/utils'
import { MessageCircleMore } from 'lucide-static'

export default fics({
  name: 'chat-button',
  className: 'fixed bottom-8 right-4',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: () => ({ svg: MessageCircleMore, areaLabel: 'Go to the chat page', isLarge: true })
  },
  html: ({ children: { icon }, template }) => template`<a href="${CHAT_PAGE}">${icon}</a>`,
  css: { ':host': { background: oklch('#282828') } }
})
