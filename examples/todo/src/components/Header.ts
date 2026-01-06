import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { absoluteCenter, calc, cssVar, flexCenter } from 'ficsjs/style'
import { $lang } from '@/stores'
import type { Lang } from '@/types'
import { breakpoints, white } from '@/utils/others'

interface Data {
  langs: Lang[]
  lang: Lang
  isShown: boolean
  header: { label: string; optionLabel: string }
}

export default fics<Data, {}>({
  name: 'header',
  children: [
    ficsLink({
      href: '/',
      content: ({ template }) => template`FiCs ToDo`,
      css: { a: { paddingInline: cssVar('xs') } }
    })
  ],
  data: () => ({
    langs: ['en', 'ja'],
    lang: 'en',
    isShown: false,
    header: { label: '', optionLabel: '' }
  }),
  i18nData: async ({ data: { lang }, i18n }) => ({
    header: await i18n<Data['header']>({ lang, key: 'header' })
  }),
  html: ({
    children: { link },
    data: {
      langs,
      lang,
      isShown,
      header: { label, optionLabel }
    },
    template,
    show
  }) => template`
    <header>
      <h1>${link}</h1>
      <div class="container">
        <button
          class="lang"
          aria-label="${label}"
          aria-controls="lang-menu"
          aria-expanded="${isShown ? 'true' : 'false'}"
          type="button"
        >${lang.toUpperCase()}</button>
        <div class="langs" id="lang-menu" role="group" aria-label="${optionLabel}" ${show(isShown)}>
          ${langs.map(
            _lang => template`
              <button
                class="${lang === _lang ? 'selected' : ''}"
                key="${_lang}"
                aria-pressed="${lang === _lang ? 'true' : 'false'}"
                type="button"
              >${_lang.toUpperCase()}</button>
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
          lineHeight: 1.5,
          '@media (forced-colors: active)': {
            background: 'none',
            backgroundClip: 'border-box',
            webkitTextFillColor: 'CanvasText',
            color: 'CanvasText'
          }
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
            '&.selected': {
              color: cssVar('red'),
              fontWeight: 'bold',
              textDecoration: 'underline',
              textUnderlineOffset: cssVar('outline')
            }
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
      click: [({ data }) => (data.isShown = !data.isShown), { throttle: 500 }]
    },
    'button[key]': {
      click: [
        ({ data, attributes: { key } }) => {
          const _key = key as Lang

          $lang.set(_key)
          data.lang = _key
          data.isShown = false
        },
        { throttle: 500 }
      ]
    }
  }
})
