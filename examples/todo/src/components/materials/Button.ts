import { fics } from 'ficsjs'
import { cssVar, oklch } from 'ficsjs/style'
import { white } from '@/utils'

export default () =>
  fics<{}, { isDisabled?: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template }) => template`
      <button aria-disabled="${isDisabled}" aria-label="${buttonText}">${buttonText}</button>
    `,
    css: {
      ':host': {
        textAlign: 'center',
        button: {
          background: cssVar('gradation'),
          padding: cssVar('md'),
          borderRadius: cssVar('xs'),
          '&[aria-disabled="true"]': {
            background: 'none',
            color: oklch(white, { opacity: 0.2 }),
            cursor: 'not-allowed'
          }
        }
      }
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
