import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { setState, getState } from 'ficsjs/state'
import { calc, variable } from 'ficsjs/style'
import { $lang } from '@/store'
import css from './style.css?inline'

export default fics<{ langs: string[]; isShown: boolean }, { lang: string; pathname: string }>({
  name: 'langs',
  data: () => ({ langs: ['en', 'ja'], isShown: false }),
  html: ({ data: { langs, isShown }, props: { lang }, template, show }) =>
    template`
      <div class="container">
        <button class="${('lang ' + (isShown ? 'shown' : '')).trim()}">${lang.toUpperCase()}</button>
        <div class="${('langs ' + (!isShown ? 'hidden' : '')).trim()}" ${show(isShown)}>
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
  css: [
    css,
    {
      'div.container': {
        button: {
          width: calc([variable('md'), 3], '*'),
          background: 'none',
          paddingBlock: variable('ex-sm'),
          '&.lang': {
            '&.shown, &:focus': { opacity: 0.5 }
          },
          '&.selected': { color: variable('red') }
        },
        div: {
          position: 'absolute',
          opacity: 1,
          transition: `${variable('transition')} allow-discrete`,
          '&.hidden': { opacity: 0 }
        }
      }
    }
  ],
  actions: {
    'button.lang': {
      click: [
        ({ data: { isShown }, setData }) => setData('isShown', !isShown),
        { throttle: 500, blur: true }
      ]
    },
    'button[key]': {
      click: [
        ({ props: { pathname }, attributes }) => {
          setState($lang, attributes['key'])
          goto(`/${getState($lang) === 'en' ? '' : getState($lang) + '/'}${pathname}`)
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})
