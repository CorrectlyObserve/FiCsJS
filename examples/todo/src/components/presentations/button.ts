import { fics } from 'ficsjs'

export default fics<{}, { btnText: string; click: () => void }>({
  name: 'button',
  html: ({ $props: { btnText }, $template }) => $template`<button>${btnText}</button>`,
  css: [
    {
      selector: 'button',
      style: {
        display: 'block',
        background: 'var(--gradation)',
        padding: 'var(--md)',
        marginInline: 'auto',
        borderRadius: 'var(--ex-sm)'
      }
    }
  ],
  actions: [
    {
      handler: 'click',
      method: ({ $props: { click }, $event: { target } }) => {
        click()
        ;(target as HTMLButtonElement).blur()
      }
    }
  ]
})
