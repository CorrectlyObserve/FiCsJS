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
  html: ({ $props: { id, value, placeholder }, $template }) =>
    $template`<input id="${id ?? ''}" value="${value}" placeholder="${placeholder}" type="text" />`,
  css: {
    selector: 'input',
    style: ({ $props: { isError } }) => (isError ? { background: 'var(--error)' } : {}),
    nested: {
      selector: '::placeholder',
      style: ({ $props: { isError } }) => (isError ? { color: '#fff', opacity: 0.5 } : {})
    }
  },
  actions: [
    {
      handler: 'input',
      selector: 'input',
      method: ({ $props: { input }, $value }) => input($value!),
      options: { debounce: 200 }
    },
    {
      handler: 'compositionstart',
      selector: 'input',
      method: ({ $setData }) => $setData('isComposing', true)
    },
    {
      handler: 'compositionend',
      selector: 'input',
      method: ({ $setData }) => $setData('isComposing', false)
    },
    {
      handler: 'keydown',
      selector: 'input',
      method: ({ $data: { isComposing }, $props: { value, enterKey }, $event }) => {
        if ((value !== '' && ($event as KeyboardEvent).key) === 'Enter' && !isComposing && enterKey)
          enterKey()
      },
      options: { throttle: 500 }
    },
    {
      handler: 'blur',
      selector: 'input',
      method: ({ $props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  ]
})
