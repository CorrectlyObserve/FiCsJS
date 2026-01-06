import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { absoluteCenter, calc, cssVar, flexCenter } from 'ficsjs/style'
import { $lang } from '@/stores'
import type { Lang } from '@/types'
import { breakpoints, white } from '@/utils/others'

const link = ficsLink({
  href: '/',
  content: ({ template }) => template`FiCs ToDo`,
  css: { a: { paddingInline: cssVar('xs') } }
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
      height: cssVar('header-height'),
      background: cssVar('black'),
      zIndex: 10,
      header: {
        ...flexCenter('xy'),
        position: 'relative',
        h1: {
          ...flexCenter('y'),
          height: cssVar('header-height'),
          fontSize: cssVar('xl'),
          background: cssVar('gradation'),
          backgroundClip: 'text',
          webkitTextFillColor: 'transparent',
          lineHeight: 1.5
        },
        'div.container': {
          ...absoluteCenter('y'),
          right: calc(`${cssVar('xl')} + ${cssVar('outline')}`),
          [`@media (max-width: ${breakpoints.sm})`]: {
            right: calc(`${cssVar('md')} * 0.75 + ${cssVar('outline')}`)
          },
          button: {
            width: calc(`${cssVar('md')} * 3`),
            background: cssVar('black'),
            paddingBlock: cssVar('md'),
            '&:hover': { background: white(0.1) },
            '&.selected': { color: cssVar('red') }
          },
          '.langs': {
            ...fadeInOut(cssVar('transition')),
            position: 'absolute',
            right: 0,
            display: 'flex',
            gap: calc(`${cssVar('outline')} * 2`),
            marginTop: calc(`${cssVar('outline')} * 2`)
          }
        }
      }
    }
  },
  hooks: { created: ({ data }) => (data.lang = document.documentElement.lang as Lang) },
  actions: {
    'button.lang': {
      click: [({ data }) => (data.isShown = !data.isShown), { throttle: 500, blur: true }]
    },
    'button[key]': {
      click: [
        ({ data, attributes: { key } }) => {
          const _key = key as Lang

          $lang.set(_key)
          data.lang = _key
          data.isShown = false
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
