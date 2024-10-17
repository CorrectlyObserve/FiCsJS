import { globalCss, useClient } from 'ficsjs'
import { getState, setState, syncState } from 'ficsjs/state'
import Header from '@/components/header'
import Router from '@/components/router'
import Footer from '@/components/footer'
import { lang } from '@/store'
import resetCss from '@/styles/resetCss'

useClient()
globalCss(resetCss)

const {
  body,
  documentElement: { lang: _lang }
} = document
let pathname = window.location.pathname.substring(1)

setState(lang, _lang || 'en')

if (pathname.split('/')[0] === getState(lang)) pathname = pathname.slice(3)

const header = await Header({ lang: getState(lang), pathname })
header.ssr(body, 'before')

Router(getState(lang)).then(component => {
  const main = document.querySelector('main')
  if (main) component.ssr(main)
})

Footer().ssr(body)

syncState({ state: lang, data: [{ fics: header, key: 'lang' }] })
