import { fics, i18n } from 'ficsjs'

export default async (lang: string) => {
  const back = await i18n({ directory: '/i18n', lang, key: 'back' })

  return fics({
    name: 'not-found',
    html: ({ $template }) => $template`<h2>404 Not Found...</h2><button>${back}</button>`,
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
        selector: 'button',
        method: ({ $props: { back } }: { $props: { back: () => void } }) => back()
      }
    ]
  })
}
