import { fics } from 'ficsjs'
import { color, variable } from 'ficsjs/css'

interface Props {
  buttonText: string
  isDisabled?: boolean
  click: () => void
}

export default fics<{}, Props>({
  name: 'button',
  html: ({ props: { buttonText, isDisabled }, template }) =>
    template`<button aria-disabled="${isDisabled}">${buttonText}</button>`,
  css: [
    { style: { display: 'block', textAlign: 'center' } },
    {
      selector: 'button',
      style: ({ props: { isDisabled } }) => ({
        background: isDisabled ? color('#fff', 0.1) : variable('gradation'),
        padding: variable('md'),
        borderRadius: variable('ex-sm')
      })
    }
  ],
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
