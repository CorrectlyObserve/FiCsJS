import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { getState } from 'ficsjs/state'
import { variable } from 'ficsjs/style'
import breakpoints from '@/breakpoints'
import langs from '@/components/multitons/containers/langs'
import { $lang } from '@/store'
import { getPath } from '@/utils'

export default fics({
  name: 'header',
  data: () => ({ lang: '', pathname: '' }),
  props: [
    {
      descendant: langs,
      values: () => ({
        lang: ({ getData }) => getData('lang'),
        pathname: ({ getData }) => getData('pathname')
      })
    }
  ],
  html: ({ template }) =>
    template`<header><h1 tabindex="0">FiCs ToDo</h1><div>${langs}</div></header>`,
  css: {
    ':host': {
      display: 'block',
      header: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBlock: variable('md'),
        [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: variable('sm') },
        h1: {
          fontSize: variable('ex-lg'),
          background: variable('gradation'),
          backgroundClip: 'text',
          webkitTextFillColor: 'transparent',
          '&:focus': { opacity: 0.2 }
        },
        div: {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          right: variable('ex-sm')
        }
      }
    }
  },
  hooks: {
    created: ({ setData }) => {
      const lang = getState<string>($lang)
      setData('lang', lang)

      let pathname = window.location.pathname.substring(1)
      if (pathname.split('/')[0] === lang) pathname = pathname.slice(3)
      setData('pathname', pathname)
    }
  },
  actions: {
    h1: { click: ({ data: { lang } }) => goto(getPath(lang, '/')) }
  }
})
