import { configGlobalCss, configI18n, i18n } from 'ficsjs'
import Header from '@/components/Header'
import Router from '@/components/Router'
import Footer from '@/components/Footer'
import globalCss from '@/globalCss'
import { $lang } from '@/stores'
import type { Lang } from '@/utils/lang'

configGlobalCss(globalCss)
configI18n('/i18n')

const sequence = (() => {
    let current = 0
    return {
      next: () => ++current,
      isLatest: (seqId: number) => seqId === current
    }
  })(),
  metaDescription = document.head.querySelector("meta[name='description']")

const syncHead = async (lang: Lang): Promise<void> => {
    const seqId = sequence.next(),
      { title, description } = await i18n<Record<'title' | 'description', string>>({
        lang,
        key: 'head'
      })

    if (!sequence.isLatest(seqId)) return

    document.title = title
    if (metaDescription?.hasAttribute('content'))
      metaDescription.setAttribute('content', description)
  },
  syncLang = (lang: Lang): void => {
    document.documentElement.lang = lang
    Header.setData('lang', lang)
    Router.setData('lang', lang)
    void syncHead(lang)
  }

Header.describe()
Router.describe()
Footer.describe()

syncLang($lang.get())
$lang.subscribe('lang', syncLang)
