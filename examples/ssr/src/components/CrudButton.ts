import { fics } from 'ficsjs'
import Button from '@/components/materials/Button'
import type { Method } from '@/types'

export default (suffix = '') =>
  fics<{}, { method: Method; click: (method: Method) => void; isDisabled: boolean }>({
    name: `crud-button${suffix}`,
    children: [Button()],
    props: {
      descendant: ({ children: { button } }) => button,
      values: ({ props: { method, click, isDisabled } }) => ({ text: method, click: () => click(method), isDisabled })
    },
    html: ({ children: { button }, template }) => template`${button}`
  })
