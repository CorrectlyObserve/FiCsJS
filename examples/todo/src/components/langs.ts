import { fics } from '@ficsjs'
import css from '@/styles/lang.css?inline'

const Langs = () =>
  fics({
    name: 'langs',
    data: () => ({ langs: ['en', 'ja'], isShown: false }),
    props: {} as { lang: string; pathname: string; switchLang: (lang: string) => void },
    html: ({
      $data: { langs, isShown },
      $props: { lang, pathname },
      $template,
      $show
    }) => $template`
    <div class="container">
      <span class="lang">${lang.toUpperCase()}</span>
      <div class="langs${!isShown ? ' hidden' : ''}" ${$show(isShown)}>
        ${langs.map(
          _lang => $template`
            <span class="${lang === _lang ? 'selected' : ''}" key="${_lang}">
              <a href="/${_lang === 'en' ? '' : _lang + '/'}${pathname}">
                ${_lang.toUpperCase()}
              </a>
            </span>
          `
        )}
      </div>
    </div>
  `,
    css: [css],
    actions: [
      {
        handler: 'click',
        selector: 'span.lang',
        method: ({ $setData, $getData }) => $setData('isShown', !$getData('isShown'))
      },
      {
        handler: 'click',
        selector: 'span[key]',
        method: ({ $props: { switchLang }, $attributes }) => switchLang($attributes['key'])
      }
    ]
  })

export default Langs
