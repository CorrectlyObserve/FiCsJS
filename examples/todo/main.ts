import { ficsCss, ficsInit } from 'ficsjs'
import { ficsI18n, i18n } from 'ficsjs/i18n'
import { getState, setState } from 'ficsjs/state'
import header from '@/components/multitons/header'
import footer from '@/components/multitons/footer'
import router from '@/components/multitons/router'
import globalCss from '@/globalCss'
import { $lang } from '@/store'

ficsInit()
ficsCss(globalCss)
ficsI18n('/i18n')

const lang = window.location.pathname.slice(1).split('/')[0] === 'ja' ? 'ja' : 'en'
document.documentElement.lang = lang
document.title = await i18n<string>({ lang, key: 'title' })

const metaTag = document.createElement('meta')
metaTag.setAttribute('name', 'description')
metaTag.setAttribute('content', await i18n<string>({ lang, key: 'content' }))
document.head.append(metaTag)

setState($lang, lang === 'ja' ? 'ja' : 'en')

header.describe()

router.setData('lang', getState($lang))
router.describe()

footer.describe()
