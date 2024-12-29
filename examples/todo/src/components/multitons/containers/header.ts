import { fics } from 'ficsjs'
import { getState } from 'ficsjs/state'
import langs from '@/components/multitons/containers/langs'
import { getPath } from '@/utils'
import { $lang } from '@/store'

export default fics({
  name: 'header',
  data: () => ({ lang: '', pathname: '' }),
  props: {
    descendant: langs,
    values: ({ getData }) => ({ lang: getData('lang'), pathname: getData('pathname') })
  },
  html: ({ data: { lang }, template }) =>
    template`<header><h1><a href="${getPath(lang, '/')}">FiCs ToDo</a></h1><div>${langs}</div></header>`,
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
  ],
  hooks: {
    created: ({ setData }) => {
      const lang = getState<string>($lang)
      setData('lang', lang)

      let pathname = window.location.pathname.substring(1)
      if (pathname.split('/')[0] === lang) pathname = pathname.slice(3)
      setData('pathname', pathname)
    }
  }
})
