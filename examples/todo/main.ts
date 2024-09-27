import { getState, setState, syncState } from '@ficsjs/state'
import Header from '@/components/header'
import Router from '@/components/router'
import Footer from '@/components/footer'
import { lang } from '@/store'

const {
  body,
  documentElement: { lang: _lang }
} = document
let pathname = window.location.pathname.substring(1)

setState(lang, _lang || 'en')

if (pathname.split('/')[0] === getState(lang)) pathname = pathname.slice(3)

const header = Header({ lang: getState(lang), pathname })
const router = Router(getState(lang))
const footer = Footer()

header.ssr(body, 'before')

const main = document.querySelector('main')
if (main) router.ssr(main)

footer.ssr(body)

syncState({ state: lang, data: [{ fics: header, key: 'lang' }] })

window.addEventListener('load', () => {
  header.define()
  router.define()
  footer.define()
})
