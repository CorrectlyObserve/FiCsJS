import { ficsCss, ficsInit } from 'ficsjs'
import { getState, setState, syncState } from 'ficsjs/state'
import header from '@/components/containers/header'
import Router from '@/components/containers/router'
import footer from '@/components/presentations/footer'
import resetCss from '@/resetCss'
import { $lang } from '@/store'

ficsInit()
ficsCss(resetCss)

const {
  body,
  documentElement: { lang }
} = document
let pathname = window.location.pathname.substring(1)

setState($lang, lang || 'en')

if (pathname.split('/')[0] === getState($lang)) pathname = pathname.slice(3)

header.setData('pathname', pathname)
header.ssr(body, 'before')
syncState({ state: $lang, data: [{ component: header, key: 'lang' }] })

const main = document.querySelector('main')
if (main) Router(getState($lang)).ssr(main)

footer.ssr(body)
