import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { absoluteCenter, cssVar, flexCenter } from 'ficsjs/style'
import Langs from '@/components/Langs'
import { $lang } from '@/store'
import { breakpoints, getPath } from '@/utils'

export default fics({
  name: 'header',
  children: [Langs],
  data: () => ({ lang: '', pathname: '' }),
  props: {
    descendant: ({ children: { langs } }) => langs,
    values: ({}) => ({
      lang: ({ getData }) => getData('lang'),
      pathname: ({ getData }) => getData('pathname'),
      getLang: (lang: string) => {
        $lang.set(lang)
        return lang
      }
    })
  },
  html: ({ children: { langs }, template }) => template`
    <header><h1 tabindex="0">FiCs ToDo</h1><div>${langs}</div></header>
  `,
  css: {
    ':host': {
      position: 'sticky',
      top: 0,
      width: '100vw',
      background: cssVar('black'),
      zIndex: 10,
      header: {
        ...flexCenter('xy'),
        position: 'relative',
        paddingBlock: cssVar('md'),
        [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: cssVar('xs') },
        h1: {
          fontSize: cssVar('xl'),
          background: cssVar('gradation'),
          backgroundClip: 'text',
          webkitTextFillColor: 'transparent',
          lineHeight: 1.5,
          '&:focus': { opacity: 0.2 }
        },
        '> div': {
          ...absoluteCenter('y'),
          right: cssVar('xl'),
          [`@media (max-width: ${breakpoints.sm})`]: { right: cssVar('xs') }
        }
      }
    }
  },
  hooks: {
    created: ({ setData }) => {
      setData('lang', $lang.get())

      const { pathname, search } = window.location
      let _pathname = `${pathname.substring(1)}${search}`
      if (_pathname.split('/')[0] === $lang.get()) _pathname = _pathname.slice(3)

      setData('pathname', `/${_pathname}`)
    }
  },
  actions: { h1: { click: ({ data: { lang } }) => goto(getPath(lang, '/')) } }
})
