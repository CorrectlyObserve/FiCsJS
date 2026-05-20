import { fics } from 'ficsjs'
import { cssVar, size, textSize } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  isDisabled?: boolean
  isPressed?: boolean
  type: 'normal' | 'gradation' | 'selected' | 'label' | 'delete'
  controls?: string
  fixedUnit?: number
  buttonText: string
  click: () => void
}

export default () =>
  fics<{}, Props>({
    name: 'button',
    html: ({
      props: { isDisabled, isPressed, type, controls, buttonText },
      template,
      attributes: { boolean }
    }) => template`
      <button
        ${isDisabled ? 'disabled' : ''}
        aria-disabled="${boolean(isDisabled)}"
        ${isPressed === undefined ? '' : `aria-pressed="${boolean(isPressed)}"`}
        ${controls ? `aria-expanded="${boolean(isPressed)}" aria-controls="${controls}"` : ''}
        type="button"
        data-type="${controls ? 'toggle' : type}"
      >${buttonText}</button>
    `,
    css: {
      ':host': ({ props: { fixedUnit } }) => ({
        textAlign: 'center',
        button: {
          ...textSize('base', true),
          ...(fixedUnit ? { width: size(fixedUnit) } : {}),
          minWidth: size(16),
          padding: size(4),
          '&[disabled]': {
            background: 'none !important',
            color: white(0.2),
            cursor: 'not-allowed'
          },
          '&:not([disabled]):active': { scale: 0.95 },
          '&[data-type="gradation"]': {
            position: 'relative',
            background: cssVar('gradation'),
            paddingInline: size(4),
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
          '&[data-type="selected"]': {
            color: cssVar('red'),
            fontWeight: 'bold',
            textDecoration: 'underline',
            textUnderlineOffset: cssVar('outline')
          },
          '&[data-type="label"]': { paddingInline: cssVar('outline') },
          '&[data-type="delete"]': { color: cssVar('red') }
        }
      })
    },
    actions: {
      button: {
        click: [
          ({ props: { isDisabled, click } }) => !isDisabled && click(),
          { throttleMs: 500, blur: true }
        ]
      }
    }
  })
