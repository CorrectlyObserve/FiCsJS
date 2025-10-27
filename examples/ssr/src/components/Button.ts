import { fics } from 'ficsjs'

export default () =>
  fics<{}, { isDisabled: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template, isBrowser }) => template`
      <button
        class="clickable text-white border border-white p-2.5 rounded-lg"
        ${!isBrowser || isDisabled ? 'disabled' : ''}
        aria-label="${buttonText}"
      >
        ${buttonText}
      </button>
    `,
    actions: {
      button: { click: [({ props: { click } }) => click(), { throttle: 500, blur: true }] }
    }
  })
