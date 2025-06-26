import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import Icon from '@/components/materials/Icon'
import { MessageCircleMore } from 'lucide-static'

export default fics({
  name: 'chat-button',
  className: 'fixed bottom-8 right-4',
  children: [Icon()],
  props: {
    descendant: ({ children: { icon } }) => icon,
    values: () => ({
      svg: MessageCircleMore,
      isLarge: true,
      areaLabel: 'Go to the chat page',
      click: () => goto('/chat')
    })
  },
  html: ({ children: { icon }, template }) => template`${icon}`
})
