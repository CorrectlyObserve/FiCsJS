import { fics, type FiCs } from 'ficsjs'
import { fade } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { color, cssVar, flex, layout, motion, positionCenter, space, textSize } from 'ficsjs/style'
import Button from '@/components/Button'
import { $lang, Lang, LANG_LIST } from '@/domain/lang'
import { breakpoints, headerHeight } from '@/styles/theme'

interface Data {
  langs: readonly Lang[]
  lang: Lang
  isShown: boolean
  label: string
}

const html: FiCs.Html<Data, {}> = ({
  children: { link, button },
  data,
  template,
  attributes: {
    a11y: { ariaLabel },
    show
  }
}) => {
  const { langs, lang, isShown, label } = data

  return template`
    <header>
      <h1>${link}</h1>
      <div class="container">
        ${button.setIndividualProps('toggle', {
          isExpanded: isShown,
          buttonText: lang.toUpperCase(),
          click: () => (data.isShown = !data.isShown)
        })}
        <div class="langs" role="group" ${ariaLabel(label)} ${show(isShown)}>
          ${langs.map(
            _lang => template`
              ${button.setIndividualProps(_lang, {
                state: lang === _lang ? 'pressed' : undefined,
                type: lang === _lang ? 'selected' : undefined,
                buttonText: _lang.toUpperCase(),
                click: () => {
                  $lang.set(_lang)
                  data.lang = _lang
                  data.isShown = false
                }
              })}
            `
          )}
        </div>
      </div>
    </header>
  `
}

const css: FiCs.Css<Data, {}> = `
  :host {
    position: sticky;
    top: 0;
    width: 100vw;
    height: ${headerHeight};
    background: ${cssVar('black')};
    z-index: 10;

    header {
      ${flex({ center: 'xy' })}
      position: relative;

      h1 {
        ${flex({ center: 'y' })}
        ${textSize('2xl')}
        height: ${headerHeight};
        background: ${cssVar('gradation')};
        background-clip: text;
        padding-block: ${space('md-')};
        -webkit-text-fill-color: transparent;

        @media (forced-colors: active) {
          background: none;
          background-clip: border-box;
          -webkit-text-fill-color: CanvasText;
          color: CanvasText;
        }
      }

      div.container {
        ${positionCenter('y')}
        right: ${space('lg')};

        @container not ${layout('expanded')} {
          right: ${space('md-')};
        }

        .langs {
          ${flex({ gap: space('xs') })}
          ${fade(motion())}
          position: absolute;
          right: 0;
          margin-block-start: ${space('xs')};
        }
      }
    }
  }
`

const hooks: FiCs.Hooks<Data, {}> = {
  created: ({ data }) => (data.lang = document.documentElement.lang as Lang)
}

export default fics<Data, {}>({
  name: 'header',
  children: [
    ficsLink({
      href: '/',
      content: ({ template }) => template`FiCs ToDo`,
      css: `a { padding-block: ${size(1)}; padding-inline: ${size(2)}; }`
    }),
    Button()
  ],
  data: () => ({ langs: LANG_LIST, lang: 'en', isShown: false, label: '' }),
  deferredData: {
    load: async ({ data: { lang }, i18n }) => ({ label: await i18n({ lang, key: 'lang' }) }),
    dataKey: 'lang',
    allowStale: true
  },
  html,
  css,
  hooks
})
