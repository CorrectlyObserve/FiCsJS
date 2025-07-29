import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { goto } from 'ficsjs/router'
import { calc, cssVar } from 'ficsjs/style'
import { breakpoints, getPath } from '@/utils'

interface Props {
  lang: string
  pathname: string
  getLang: (lang: string) => string
}

export default fics<{ langs: string[]; isShown: boolean }, Props>({
  name: 'langs',
  data: () => ({ langs: ['en', 'ja'], isShown: false }),
  html: ({ data: { langs, isShown }, props: { lang }, template, show }) => template`
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
  `,
  css: {
    'div.container': {
      button: {
        width: calc([cssVar('md'), 3], '*'),
        background: cssVar('black'),
        paddingBlock: cssVar('xs'),
        [`@media (max-width: ${breakpoints.sm})`]: { paddingBlock: cssVar('md') },
        '&.lang:focus': { opacity: 0.5 },
        '&.selected': { color: cssVar('red') }
      },
      '.langs': { ...fadeInOut(cssVar('transition')), position: 'absolute' }
    }
  },
  actions: {
    'button.lang': {
      click: [
        ({ data: { isShown }, setData }) => setData('isShown', !isShown),
        { throttle: 500, blur: true }
      ]
    },
    'button[key]': {
      click: [
        ({ props: { pathname, getLang }, setData, attributes }) => {
          setData('isShown', false)
          goto(getPath(getLang(attributes['key']), pathname))
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
