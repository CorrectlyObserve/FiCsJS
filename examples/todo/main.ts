import { configGlobalCss, configI18n, i18n } from 'ficsjs'
import Header from '@/components/Header'
import Router from '@/components/Router'
import Footer from '@/components/Footer'
import globalCss from '@/globalCss'
import { $lang } from '@/stores'

configGlobalCss(globalCss)
configI18n('/i18n')

const lang = window.location.pathname.slice(1).split('/')[0] === 'ja' ? 'ja' : 'en'

if (lang === 'ja') {
  const { title, description } = await i18n<Record<string, string>>({ lang, key: 'head' })

  document.documentElement.lang = lang
  document.title = title

  const metaTag = document.head.querySelector("meta[name='description']")
  if (metaTag && metaTag?.hasAttribute('content')) metaTag.setAttribute('content', description)
}

$lang.set(lang)
$lang.subscribe('lang', lang => {
  document.documentElement.lang = lang
  Router.setData('lang', lang)
})

Header.describe()
Router.describe()
Footer.describe()
