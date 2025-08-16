import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { goto } from 'ficsjs/router'
import { absoluteCenter, calc, cssVar, flexCenter } from 'ficsjs/style'
import { $lang } from '@/store'
import type { Lang } from '@/types'
import { backToTop, breakpoints } from '@/utils'

export default fics({
  name: 'header',
  data: () => ({ langs: ['en', 'ja'] as Lang[], lang: 'en' as Lang, isShown: false, pathname: '' }),
  html: ({ data: { langs, lang, isShown }, template, show }) => template`
    <header>
      <h1 tabindex="0">FiCs ToDo</h1>
      <div class="container">
        <button class="lang">${lang.toUpperCase()}</button>
        <div class="langs" ${show(isShown)}>
          ${langs.map(
            _lang => template`
              <button class="${lang === _lang ? 'selected' : ''}" key="${_lang}">
                ${_lang.toUpperCase()}
              </button>
            `
          )}
        </div>
      </div>
    </header>
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
        'div.container': {
          ...absoluteCenter('y'),
          right: cssVar('xl'),
          [`@media (max-width: ${breakpoints.sm})`]: { right: cssVar('xs') },
          button: {
            width: calc(`${cssVar('md')} * 3`),
            background: cssVar('black'),
            paddingBlock: cssVar('xs'),
            [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: cssVar('md') },
            '&.lang:focus': { opacity: 0.5 },
            '&.selected': { color: cssVar('red') }
          },
          '.langs': { ...fadeInOut(cssVar('transition')), position: 'absolute' }
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
  actions: {
    h1: { click: ({ data: { lang } }) => backToTop(lang) },
    'button.lang': {
      click: [
        ({ data: { isShown }, setData }) => setData('isShown', !isShown),
        { throttle: 500, blur: true }
      ]
    },
    'button[key]': {
      click: [
        ({ data: { pathname }, setData, attributes: { key } }) => {
          setData('isShown', false)
          $lang.set(key as Lang)
          if (pathname !== '/404') goto(`/${key}${pathname}`)
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
