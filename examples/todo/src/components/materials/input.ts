import { fics } from 'ficsjs'
import { calc, color, variable } from 'ficsjs/style'

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

export default fics<{ isComposing: boolean }, Props>({
  name: 'input',
  data: () => ({ isComposing: false }),
  html: ({ props: { id, label, isError, error, value, placeholder }, template, show }) =>
    template`
      <div>
        ${label ? template`<div><label for="${id ?? ''}">${label}</label></div>` : ''}
        <p ${show(!!isError)}>${error}</p>
        <input id="${id ?? ''}" value="${value}" placeholder="${placeholder}" type="text" />
      </div>
    `,
  css: {
    div: ({ props: { isError } }) => ({
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      label: { paddingBottom: variable('xs') },
      p: {
        fontSize: variable('sm'),
        color: variable('error'),
        marginBottom: variable('xs'),
        textAlign: 'left'
      },
      input: {
        minWidth: calc([variable('md'), 20], '*'),
        maxWidth: calc([calc([variable('md'), 30], '*'), calc([variable('xl'), 2], '*')], '-'),
        background: isError ? variable('error') : color('#fff', 0.1),
        fontSize: variable('md'),
        color: '#fff',
        padding: `${calc([variable('xs'), 1.5], '*')} ${variable('md')}`,
        borderRadius: variable('xs'),
        border: 'none',
        outline: 'none',
        lineHeight: 1.5,
        '&::placeholder': isError ? { color: '#fff', opacity: 0.5 } : {},
        '&:hover': { cursor: 'pointer' },
        '&:focus': { background: color('#fff', 0.8), color: variable('black'), cursor: 'auto' }
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
