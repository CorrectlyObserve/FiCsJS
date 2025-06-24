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
    values: () => ({ svg: MessageCircleMore, isLarge: true })
  },
  html: ({ children: { icon }, template }) => template`
    <button class="clickable text-white" aria-label="go to the chat page">${icon}</button>
  `,
  css: { ':host > button.clickable:focus': { scale: 0.8 } },
  actions: { button: { click: [() => goto('/chat'), { throttle: 500, blur: true }] } }
})
