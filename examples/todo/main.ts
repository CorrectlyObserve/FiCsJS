import { ficsCss, ficsInit } from 'ficsjs'
import { getState, setState, syncState } from 'ficsjs/state'
import Header from '@/components/containers/header'
import Router from '@/components/containers/router'
import footer from '@/components/presentations/footer'
import resetCss from '@/resetCss'
import { lang } from '@/store'

ficsInit()
ficsCss(resetCss)

const {
  body,
  documentElement: { lang: _lang }
} = document
let pathname = window.location.pathname.substring(1)

setState(lang, _lang || 'en')

if (pathname.split('/')[0] === getState(lang)) pathname = pathname.slice(3)

await Header().then(header => {
  header.setData('pathname', pathname)
  header.ssr(body, 'before')
  syncState({ state: lang, data: [{ fics: header, key: 'lang' }] })
})

await Router().then(router => {
  const main = document.querySelector('main')
  if (main) router.ssr(main)
})

footer.ssr(body)
