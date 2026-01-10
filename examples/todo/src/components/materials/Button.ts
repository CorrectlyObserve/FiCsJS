import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'

export default () =>
  fics<{}, { isDisabled?: boolean; buttonText: string; click: () => void }>({
    name: 'button',
    html: ({ props: { isDisabled, buttonText }, template, attributes: { boolean } }) => template`
      <button
        ${isDisabled ? 'disabled' : ''}
        aria-disabled="${boolean(isDisabled)}"
        type="button"
      >${buttonText}</button>
    `,
    css: {
      ':host': {
        textAlign: 'center',
        button: {
          position: 'relative',
          background: cssVar('gradation'),
          padding: cssVar('md'),
          overflow: 'hidden',
          zIndex: 0,
          '&::before': {
            position: 'absolute',
            content: "''",
            inset: 0,
            background: cssVar('black'),
            opacity: 0,
            transition: cssVar('transition'),
            zIndex: -1
          },
          '&:not([disabled]):hover::before': { opacity: 0.5 }
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
