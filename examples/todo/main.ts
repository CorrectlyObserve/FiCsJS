import { ficsGlobalCss, ficsInit } from 'ficsjs'
import { ficsI18n } from 'ficsjs/i18n'
import { getState, setState, syncState } from 'ficsjs/state'
import header from '@/components/multitons/containers/header'
import router from '@/components/multitons/containers/router'
import footer from '@/components/multitons/presentations/footer'
import globalCss from '@/globalCss'
import { $lang } from '@/store'

ficsInit()
ficsGlobalCss(globalCss)
ficsI18n('/i18n')

const {
  body,
  documentElement: { lang }
} = document

setState($lang, lang || 'en')
syncState({ state: $lang, data: { lang: header } })

header.ssr(body, 'before')

const main = document.querySelector('main')
if (main) {
  router.setData('lang', getState($lang))
  router.ssr(main)
}

footer.ssr(body)
