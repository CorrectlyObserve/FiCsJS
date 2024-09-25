import { setState } from '@ficsjs/state'
import Header from '@/components/header'
import Router from '@/components/router'
import Footer from '@/components/footer'
import { lang } from '@/store'

const {
  body,
  documentElement: { lang: _lang }
} = document

setState(lang, _lang || 'en')

Header.ssr(body, 'before')

const main = document.querySelector('main')
if (main) Router.ssr(main)

Footer.ssr(body)

window.addEventListener('load', () => {
  Header.define()
  Router.define()
  Footer.define()
})
