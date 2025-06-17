import { fics } from 'ficsjs'
import { calc, color, cssVar, flexCenter } from 'ficsjs/style'
import { white } from '@/utils'

interface Props {
  id?: string
  label?: string
  isError?: boolean
  error: string
  value: string
  placeholder: string
  input: (value: string) => void
  enterKey?: () => void
  blur?: () => void
}

export default () =>
  fics<{ isComposing: boolean }, Props>({
    name: 'input',
    data: () => ({ isComposing: false }),
    html: ({ props: { id, label, isError, error, value, placeholder }, template, show }) => template`
      <div>
        ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
        <p ${show(!!isError)}>${error}</p>
        <input id="${id ?? ''}" value="${value}" placeholder="${placeholder}" type="text" />
      </div>
    `,
    css: {
      div: ({ props: { isError } }) => ({
        ...flexCenter('x', 'column'),
        label: { paddingBottom: cssVar('xs') },
        p: {
          fontSize: cssVar('sm'),
          color: cssVar('error'),
          marginBottom: cssVar('xs'),
          textAlign: 'left'
        },
        input: {
          minWidth: calc([cssVar('md'), 20], '*'),
          maxWidth: calc([calc([cssVar('md'), 30], '*'), calc([cssVar('xl'), 2], '*')], '-'),
          background: isError ? cssVar('error') : color({ hex: white, rate: 0.1 }),
          fontSize: cssVar('md'),
          color: white,
          padding: `${calc([cssVar('xs'), 1.5], '*')} ${cssVar('md')}`,
          borderRadius: cssVar('xs'),
          border: 'none',
          outline: 'none',
          lineHeight: 1.5,
          '&::placeholder': isError ? { color: white, opacity: 0.5 } : {},
          '&:hover': { cursor: 'pointer' },
          '&:focus': {
            background: color({ hex: white, rate: 0.8 }),
            color: cssVar('black'),
            cursor: 'auto'
          }
        }
      })
    },
    actions: {
      input: {
        input: [({ props: { input }, value }) => input(value!), { debounce: 200 }],
        compositionstart: ({ setData }) => setData('isComposing', true),
        compositionend: ({ setData }) => setData('isComposing', false),
        keydown: [
          ({ data: { isComposing }, props: { value, enterKey }, event }) => {
            if (
              (value !== '' && (event as KeyboardEvent).key) === 'Enter' &&
              !isComposing &&
              enterKey
            )
              enterKey()
          },
          { throttle: 500 }
        ],
        blur: ({ props: { value, blur } }) => {
          if (value !== '' && blur) blur()
        }
      }
    }
  })
