import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { getState } from 'ficsjs/state'
import { variable } from 'ficsjs/style'
import Langs from '@/components/multitons/langs'
import { $lang } from '@/store'
import { breakpoints, getPath } from '@/utils'

const langs = Langs()

export default () =>
  fics({
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
      template`<header><h1 tabindex="0">FiCs ToDo</h1><div>${langs}</d></header>`,
    css: {
      ':host': {
        position: 'fixed',
        display: 'block',
        width: '100vw',
        background: variable('black'),
        zIndex: 10,
        header: {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBlock: variable('md'),
          [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: variable('xs') },
          h1: {
            fontSize: variable('xl'),
            background: variable('gradation'),
            backgroundClip: 'text',
            webkitTextFillColor: 'transparent',
            lineHeight: 1.5,
            '&:focus': { opacity: 0.2 }
          },
          '> div': {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: variable('xl'),
            [`@media (max-width: ${breakpoints.sm})`]: { right: variable('xs') }
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
