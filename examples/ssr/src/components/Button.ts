import { fics } from 'ficsjs'

export default () =>
  fics<{}, { isDisabled: boolean; text: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, text }, template }) => template`
      <button class="clickable text-white border border-white p-3 rounded-lg" aria-disabled="${isDisabled}">${text}</button>
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
