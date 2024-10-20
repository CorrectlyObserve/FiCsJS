import { fics, i18n } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { setState, getState } from 'ficsjs/state'
import langs from '@/components/presentations/langs/'

export default async ({ lang, pathname }: { lang: string; pathname: string }) => {
  const title = await i18n({ directory: '/i18n', lang, key: 'title' })

  return fics({
    name: 'header',
    data: () => ({ lang, pathname }),
    inheritances: [
      {
        descendant: langs,
        props: ({ $getData }) => ({
          lang: $getData('lang'),
          switchLang: (_lang: string) => {
            setState(lang, _lang)
            goto(`/${getState(lang) === 'en' ? '' : getState(lang) + '/'}${$getData('pathname')}`)
          }
        })
      }
    ],
    html: ({ $template }) => $template`<header><h1>${title}</h1><div>${langs}</div></header>`,
    css: [
      { style: { display: 'block', marginBottom: 'var(--lg)' } },
      {
        selector: 'header',
        style: {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBlock: 'var(--md)'
        },
        nested: [
          {
            selector: '> h1',
            style: {
              background: 'var(--gradation)',
              backgroundClip: 'text',
              webkitTextFillColor: 'transparent'
            }
          },
          {
            selector: '> div',
            style: {
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: 'var(--ex-sm)'
            }
          }
        ]
      }
    ]
  })
}
