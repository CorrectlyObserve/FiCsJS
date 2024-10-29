import { fics } from 'ficsjs'

interface Props {
  buttonText: string
  click: () => void
}

export default fics<{}, Props>({
  name: 'button',
  html: ({ $props: { buttonText }, $template }) => $template`<button>${buttonText}</button>`,
  css: {
    selector: 'button',
    style: {
      display: 'block',
      background: 'var(--gradation)',
      padding: 'var(--md)',
      marginInline: 'auto',
      borderRadius: 'var(--ex-sm)'
    }
  },
  actions: {
    handler: 'click',
    method: ({ $props: { click } }) => click(),
    options: { blur: true }
  }
})
