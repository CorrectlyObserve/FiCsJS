import { fics } from 'ficsjs'
import { variable } from 'ficsjs/css'

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
      ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
      <p class="error" ${show(!!isError)}>${error}</p>
      <input id="${id ?? ''}" value="${value}" placeholder="${placeholder}" type="text" />
    `,
  css: {
    'label, p': { marginBottom: variable('ex-sm') },
    'p.error': { color: variable('error'), textAlign: 'left' },
    input: ({ props: { isError } }) => ({
      background: isError ? variable('error') : undefined,
      '&::placeholder': isError ? { color: '#fff', opacity: 0.5 } : {}
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
