import { fics } from 'ficsjs'
import i18n from 'ficsjs/i18n'
import { goto } from 'ficsjs/router'
import { setState, getState } from 'ficsjs/state'
import langs from '@/components/presentations/langs/'
import { lang } from '@/store'

export default async () => {
  const _lang = getState<string>(lang)
  const title = await i18n<string>({ directory: '/i18n', lang: _lang, key: 'title' })

  return fics({
    name: 'header',
    data: () => ({ lang: _lang, pathname: '' }),
    props: {
      descendant: langs,
      values: ({ $data: { lang: _lang, pathname } }) => ({
        lang: _lang,
        switchLang: (_lang: string) => {
          setState(lang, _lang)
          goto(`/${getState(lang) === 'en' ? '' : getState(lang) + '/'}${pathname}`)
        }
      })
    },
    html: ({ $template }) => $template`<header><h1>${title}</h1><div>${langs}</div></header>`,
    css: [
      { style: { display: 'block' } },
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
