import { fics } from 'ficsjs'

interface Props {
  buttonText: string
  click: () => void
}

export default fics<{}, Props>({
  name: 'button',
  html: ({ $props: { buttonText }, $template }) => $template`<button>${buttonText}</button>`,
  css: [
    { style: { display: 'block', textAlign: 'center' } },
    {
      selector: 'button',
      style: { background: 'var(--gradation)', padding: 'var(--md)', borderRadius: 'var(--ex-sm)' }
    }
  ],
  actions: [
    {
      handler: 'click',
      selector: 'button',
      method: ({ $props: { click } }) => click(),
      options: { throttle: 500, blur: true }
    }
  ]
})
