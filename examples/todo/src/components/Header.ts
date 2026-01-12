import { fics } from 'ficsjs'
import { fadeInOut } from 'ficsjs/animation'
import { ficsLink } from 'ficsjs/router'
import { absoluteCenter, calc, cssVar, flexCenter } from 'ficsjs/style'
import Button from '@/components/materials/Button'
import { $lang } from '@/stores'
import type { Lang } from '@/types'
import { breakpoints } from '@/utils/others'

export default fics<{ langs: Lang[]; lang: Lang; isShown: boolean; label: string }, {}>({
  name: 'header',
  children: [
    ficsLink({
      href: '/',
      content: ({ template }) => template`FiCs ToDo`,
      css: { a: { paddingInline: cssVar('xs') } }
    }),
    Button()
  ],
  data: () => ({ langs: ['en', 'ja'], lang: 'en', isShown: false }),
  i18nData: async ({ data: { lang }, i18n }) => ({ label: await i18n({ lang, key: 'lang' }) }),
  html: ({ children: { link, button }, data, template, show }) => {
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
  },
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
  hooks: { created: ({ data }) => (data.lang = document.documentElement.lang as Lang) }
})
