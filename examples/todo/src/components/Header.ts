import { fics, type FiCs } from 'ficsjs'
import { fade } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { calc, cssVar, flexCenter, positionCenter, size, textSize } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import { $lang } from '@/stores'
import { Lang, LANG_LIST } from '@/utils/lang'
import { breakpoints } from '@/utils/style'

interface Data {
  langs: readonly Lang[]
  lang: Lang
  isShown: boolean
  label: string
}

const html: FiCs.Html<Data, {}> = ({ children: { link, button }, data, template, show }) => {
  const { langs, lang, isShown, label } = data

  return template`
    <header>
      <h1>${link}</h1>
      <div class="container">
        ${button.setIndividualProps('toggle', {
          isPressed: isShown,
          controls: 'lang-menu',
          buttonText: lang.toUpperCase(),
          click: () => (data.isShown = !data.isShown)
        })}
        <div class="langs" id="lang-menu" role="group" aria-label="${label}" ${show(isShown)}>
          ${langs.map(
            _lang => template`
              ${button.setIndividualProps(_lang, {
                type: lang === _lang ? 'selected' : 'normal',
                isPressed: lang === _lang,
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

const buttonHeight = calc(`${size(4)} * 3 + ${cssVar('outline')} * 2`)
const headerHeight = calc(`${buttonHeight} + ${size(6)}`)
const css: FiCs.Css<Data, {}> = `
  :host {
    position: sticky;
    top: 0;
    width: 100vw;
    height: ${headerHeight};
    background: ${cssVar('black')};
    z-index: 10;

    header {
      ${flexCenter('xy')}
      position: relative;

      h1 {
        ${flexCenter('y')}
        ${textSize('2xl')}
        height: ${headerHeight};
        background: ${cssVar('gradation')};
        background-clip: text;
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
        right: ${calc(`${size(8)} + ${cssVar('outline')}`)};

        @media (max-width: ${breakpoints.SM}) {
          right: ${calc(`${size(3)} + ${cssVar('outline')}`)};
        }

        .langs {
          ${fade(cssVar('transition'))}
          position: absolute;
          right: 0;
          display: flex;
          gap: ${calc(`${cssVar('outline')} * 2`)};
          margin-block-start: ${calc(`${cssVar('outline')} * 2`)};
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
  data: () => ({ langs: LANG_LIST, lang: 'en', isShown: false }),
  i18nData: async ({ data: { lang }, i18n }) => ({ label: await i18n({ lang, key: 'lang' }) }),
  html,
  css,
  hooks
})
