import { ficsCss, ficsInit } from 'ficsjs'
import { ficsI18n, i18n } from 'ficsjs/i18n'
import { getState, setState } from 'ficsjs/state'
import Header from '@/components/multitons/header'
import Router from '@/components/multitons/router'
import Footer from '@/components/multitons/footer'
import globalCss from '@/globalCss'
import { $lang } from '@/store'

ficsInit()
ficsCss(globalCss)
ficsI18n('/i18n')

const lang = window.location.pathname.slice(1).split('/')[0] === 'ja' ? 'ja' : 'en'

if (lang === 'ja') {
  const { title, description } = await i18n<Record<string, string>>({ lang, key: 'head' })

  document.documentElement.lang = lang
  document.title = title

  const metaTag = document.head.querySelector("meta[name='description']")
  if (metaTag && metaTag?.hasAttribute('content')) metaTag.setAttribute('content', description)
}

setState($lang, lang)

Header().describe()

const router = Router()
router.setData('lang', getState($lang))
router.describe()

Footer().describe()
