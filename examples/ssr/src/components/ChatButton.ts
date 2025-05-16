import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import Icon from '@/components/Icon'
import { MessageCircleMore } from 'lucide-static'

const icon = Icon()

export default () =>
  fics({
    name: 'chat-button',
    className: 'fixed bottom-8 right-4',
    props: [{ descendant: icon, values: () => ({ icon: MessageCircleMore, isLarge: true }) }],
    html: ({ template }) => template`
      <button class="clickable text-white" aria-label="to the chat page">${icon}</button>
    `,
    css: { ':host > button.clickable:focus': { scale: 0.8 } },
    actions: { button: { click: [() => goto('/chat'), { throttle: 500, blur: true }] } }
  })
