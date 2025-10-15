import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { absoluteCenter, calc, cssVar, flexCenter } from 'ficsjs/style'
import { $lang } from '@/stores'
import type { Lang } from '@/types'
import { breakpoints } from '@/utils/others'

const link = ficsLink({
  href: '/',
  content: ({ template }) => template`FiCs ToDo`,
  css: { ':host > a:hover': { opacity: 1 } }
})

export default fics({
  name: 'header',
  data: () => ({ langs: ['en', 'ja'] as Lang[], lang: 'en' as Lang, isShown: false }),
  html: ({ data: { langs, lang, isShown }, template, show }) => template`
    <header>
      <h1>${link}</h1>
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
          lineHeight: 1.5
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
  hooks: { created: ({ setData }) => setData('lang', document.documentElement.lang as Lang) },
  actions: {
    'button.lang': {
      click: [
        ({ data: { isShown }, setData }) => setData('isShown', !isShown),
        { throttle: 500, blur: true }
      ]
    },
    'button[key]': {
      click: [
        ({ setData, attributes: { key } }) => {
          const _key = key as Lang

          $lang.set(_key)
          setData('lang', _key)
          setData('isShown', false)
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
