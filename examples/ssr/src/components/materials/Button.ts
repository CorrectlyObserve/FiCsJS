import { fics } from 'ficsjs'

export default () =>
  fics<{}, { isDisabled: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template, isBrowser }) => template`
      <button
        class="clickable text-white border border-white p-3 rounded-lg"
        aria-disabled="${!isBrowser || isDisabled}"
        aria-label="${buttonText}"
      >
        ${buttonText}
      </button>
    `,
    actions: {
      button: {
        click: [
          ({ props: { isDisabled, click } }) => {
            if (!isDisabled) click()
          },
          { throttle: 500, blur: true }
        ]
      }
    }
  })
