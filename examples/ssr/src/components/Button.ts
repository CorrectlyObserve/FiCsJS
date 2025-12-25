import { fics } from 'ficsjs'
import { white } from '@/utils'

export default () =>
  fics<{}, { isDisabled: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template, isBrowser }) => template`
      <button
        class="clickable w-24 text-white border border-white p-3 rounded-lg"
        ${!isBrowser || isDisabled ? 'disabled' : ''}
        aria-disabled="${isDisabled ? 'true' : 'false'}"
        type="button"
      >${buttonText}</button>
    `,
    css: { 'button:hover:not([disabled])': { background: white(0.1) } },
    actions: {
      button: { click: [({ props: { click } }) => click(), { throttle: 500, blur: true }] }
    }
  })
