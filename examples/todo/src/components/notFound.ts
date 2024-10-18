import { fics, i18n } from 'ficsjs'
import { goto } from 'ficsjs/router'

export default async (lang: string) => {
  const back = await i18n({ directory: '/i18n', lang, key: 'back' })

  return fics({
    name: 'not-found',
    isImmutable: true,
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
      { handler: 'click', selector: 'button', method: () => goto(`/${lang === 'en' ? '' : lang}`) }
    ]
  })
}
