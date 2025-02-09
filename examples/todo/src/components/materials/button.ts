import { fics } from 'ficsjs'
import { color, variable } from 'ficsjs/style'
import { white } from '@/utils'

export default () => fics<{}, { buttonText: string; isDisabled?: boolean; click: () => void }>({
  name: 'button',
  html: ({ props: { buttonText, isDisabled }, template }) =>
    template`<button aria-disabled="${isDisabled}">${buttonText}</button>`,
  css: {
    ':host': { display: 'block', textAlign: 'center' },
    button: ({ props: { isDisabled } }) => ({
      background: isDisabled ? color({ hex: white, rate: 0.1 }) : variable('gradation'),
      padding: variable('md'),
      borderRadius: variable('xs'),
      '&[aria-disabled="true"]': {
        background: 'none',
        color: color({ hex: white, rate: 0.2 }),
        cursor: 'not-allowed'
      }
    })
  },
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
