import { fics } from 'ficsjs'
import Button from '@/components/Button'
import type { Method } from '@/types'

export default fics<{}, { method: Method; click: (method: Method) => void }>({
  name: 'crud-button',
  children: [Button()],
  props: {
    descendant: ({ children: { button } }) => button,
    values: ({ props: { method, click } }) => ({ buttonText: method, click: () => click(method) })
  },
  html: ({ children: { button }, template }) => template`${button}`
})
