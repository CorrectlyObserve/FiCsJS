import { configGlobalCss, configI18n, i18n } from 'ficsjs'
import { applyMeta, type FiCsRouter } from 'ficsjs/router'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import globalCss from '@/globalCss'
import type { Data } from '@/pages/+spa'
import { $lang } from '@/stores'
import type { Lang } from '@/utils/lang'
import '@/global.css'

configGlobalCss(globalCss)
configI18n('/i18n')

const syncLang = async (lang: Lang): Promise<void> => {
  document.documentElement.lang = lang

  try {
    const meta = await i18n<Record<'title' | 'description', string>>({ lang, key: 'head' })

    // A later call can finish before an earlier one, as i18n caches each language.
    if ($lang.get() !== lang) return

    applyMeta(meta, { merge: true })
  } catch (error) {
    // A failure here is not fatal, as the page renders without head translations.
    console.warn(error)
  }
}

void syncLang($lang.get())
$lang.subscribe('lang', lang => void syncLang(lang))

const layout: FiCsRouter.Layout<Data> = ({ slot, template }) =>
  template`${Header}<main>${slot}</main>${Footer}`

export default layout
