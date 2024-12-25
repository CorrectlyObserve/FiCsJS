import { fics } from 'ficsjs'

interface Props {
  id?: string
  value: string
  placeholder: string
  isError?: boolean
  input: (value: string) => void
  enterKey?: () => void
  blur?: () => void
}

export default fics<{ isComposing: boolean }, Props>({
  name: 'input',
  data: () => ({ isComposing: false }),
  html: ({ props: { id, value, placeholder }, template }) =>
    template`<input id="${id ?? ''}" value="${value}" placeholder="${placeholder}" type="text" />`,
  css: {
    selector: 'input',
    style: ({ props: { isError } }) => (isError ? { background: 'var(--error)' } : {}),
    nested: {
      selector: '::placeholder',
      style: ({ props: { isError } }) => (isError ? { color: '#fff', opacity: 0.5 } : {})
    }
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
