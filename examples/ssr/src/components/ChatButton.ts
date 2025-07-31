import { fics } from 'ficsjs'
import Icon from '@/components/materials/Icon'
import { MessageCircleMore } from 'lucide-static'

export default fics({
  name: 'chat-button',
  className: 'fixed bottom-8 right-4',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: () => ({ svg: MessageCircleMore, areaLabel: 'Go to the chat page', isLarge: true })
  },
  html: ({ children: { icon }, template }) => template`<a href="/chat">${icon}</a>`,
  css: { ':host': { background: '#282828' } }
})
