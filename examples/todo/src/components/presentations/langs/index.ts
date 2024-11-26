import { fics } from 'ficsjs'
import css from './style.css?inline'

interface Data {
  langs: string[]
  isShown: boolean
}

interface Props {
  lang: string
  switchLang: (lang: string) => void
}

export default fics<Data, Props>({
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
  css,
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
      method: ({ $props: { switchLang }, $attributes }) => switchLang($attributes['key']),
      options: { throttle: 500, blur: true }
    }
  ]
})
