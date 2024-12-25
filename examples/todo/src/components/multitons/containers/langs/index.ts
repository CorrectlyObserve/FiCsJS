import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { setState, getState } from 'ficsjs/state'
import { $lang } from '@/store'
import css from './style.css?inline'

export default fics<{ langs: string[]; isShown: boolean }, { lang: string; pathname: string }>({
  name: 'langs',
  data: () => ({ langs: ['en', 'ja'], isShown: false }),
  html: ({ $data: { langs, isShown }, $props: { lang }, $template, $show }) =>
    $template`
      <div class="container">
        <button class="${('lang ' + (isShown ? 'shown' : '')).trim()}">${lang.toUpperCase()}</button>
        <div class="${('langs ' + (!isShown ? 'hidden' : '')).trim()}" ${$show(isShown)}>
          ${langs.map(
            _lang => $template`
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
      selector: 'div.container',
      style: {},
      nested: [
        {
          selector: 'button',
          style: {
            width: 'calc(var(--md) * 3)',
            background: 'none',
            paddingBlock: 'var(--ex-sm)'
          },
          nested: [
            {
              selector: '&.lang',
              style: {},
              nested: [{ selector: ['&.shown', ':focus'], style: { opacity: 0.5 } }]
            },
            { selector: '&.selected', style: { color: 'var(--red)' } }
          ]
        },
        {
          selector: 'div',
          style: {
            position: 'absolute',
            opacity: 1,
            transition: 'var(--transition) allow-discrete'
          },
          nested: { selector: '&.hidden', style: { opacity: 0 } }
        }
      ]
    }
  ],
  actions: [
    {
      handler: 'click',
      selector: 'button.lang',
      method: ({ $data: { isShown }, $setData }) => $setData('isShown', !isShown),
      options: { throttle: 500, blur: true }
    },
    {
      handler: 'click',
      selector: 'button[key]',
      method: ({ $props: { pathname }, $attributes }) => {
        setState($lang, $attributes['key'])
        goto(`/${getState($lang) === 'en' ? '' : getState($lang) + '/'}${pathname}`)
      },
      options: { throttle: 500, blur: true }
    }
  ]
})
