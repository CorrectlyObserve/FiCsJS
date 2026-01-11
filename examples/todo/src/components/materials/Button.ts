import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  isDisabled?: boolean
  isPressed?: boolean
  type: 'normal' | 'gradation' | 'label' | 'delete'
  buttonText: string
  click: () => void
}

export default () =>
  fics<{}, Props>({
    name: 'button',
    html: ({
      props: { isDisabled, isPressed, type, buttonText },
      template,
      attributes: { boolean }
    }) => template`
      <button
        ${isDisabled ? 'disabled' : ''}
        aria-disabled="${boolean(isDisabled)}"
        ${isPressed === undefined ? '' : `aria-pressed="${boolean(isPressed)}"`}
        type="button"
        data-type="${type}"
      >${buttonText}</button>
    `,
    css: {
      ':host': {
        textAlign: 'center',
        button: {
          padding: cssVar('md'),
          '&[disabled]': {
            background: 'none !important',
            color: white(0.2),
            cursor: 'not-allowed'
          },
          '&:not([disabled]):active': { scale: 0.95 },
          '&[data-type="gradation"]': {
            position: 'relative',
            background: cssVar('gradation'),
            paddingInline: cssVar('md'),
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
          },
          '&[data-type="label"]': { paddingInline: cssVar('outline') },
          '&[data-type="delete"]': { color: cssVar('red') }
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
