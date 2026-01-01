import { fics } from 'ficsjs'
import { white } from '@/utils'

export default () =>
  fics<{}, { isDisabled: boolean; isCurrent?: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, isCurrent, buttonText }, template, isBrowser }) => template`
      <button
        class="clickable w-24 text-white border border-white p-3 rounded-lg"
        ${!isBrowser || isDisabled ? 'disabled' : ''}
        aria-disabled="${!isBrowser || isDisabled ? 'true' : 'false'}"
        ${isCurrent ? 'aria-current="page"' : ''}
        type="button"
      >${buttonText}</button>
    `,
    css: {
      button: {
        '&:not([disabled]):hover': { background: white(0.1) },
        '&[aria-current="page"]': { color: white(0.5), borderColor: white(0.5) }
      }
    },
    actions: {
      button: { click: [({ props: { click } }) => click(), { throttle: 500, blur: true }] }
    }
  })
