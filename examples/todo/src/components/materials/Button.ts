import { fics } from 'ficsjs'
import { color, cssVar } from 'ficsjs/style'
import { white } from '@/utils'

export default () =>
  fics<{}, { isDisabled?: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template }) => template`
      <button aria-disabled="${isDisabled}" aria-label="${buttonText}">${buttonText}</button>
    `,
    css: {
      ':host': { textAlign: 'center' },
      button: ({ props: { isDisabled } }) => ({
        background: isDisabled ? color({ hex: white, rate: 0.1 }) : cssVar('gradation'),
        padding: cssVar('md'),
        borderRadius: cssVar('xs'),
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
