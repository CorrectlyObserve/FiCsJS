import { fics } from 'ficsjs'

interface Props {
  buttonText: string
  isDisabled?: boolean
  click: () => void
}

export default fics<{}, Props>({
  name: 'button',
  html: ({ props: { buttonText, isDisabled }, template }) =>
    template`<button ${isDisabled ? 'disabled' : ''}>${buttonText}</button>`,
  css: [
    { style: { display: 'block', textAlign: 'center' } },
    {
      selector: 'button',
      style: ({ props: { isDisabled } }) => ({
        background: isDisabled ? 'rgba(255, 255, 255, 0.1)' : 'var(--gradation)',
        padding: 'var(--md)',
        borderRadius: 'var(--ex-sm)'
      })
    }
  ],
  actions: [
    {
      handler: 'click',
      selector: 'button',
      method: ({ props: { isDisabled, click } }) => {
        if (!isDisabled) click()
      },
      options: { throttle: 500, blur: true }
    }
  ]
})
