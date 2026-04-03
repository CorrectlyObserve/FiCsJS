import { fics } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { cssVar, forScreenReaders } from 'ficsjs/style'
import type { Lang } from '@/types'
import { white } from '@/utils/others'
import { Loader } from 'lucide-static'

export default () =>
  fics<{ texts: Record<Lang, string> }, { lang: Lang }>({
    name: 'loading',
    data: () => ({ texts: { en: 'Loading...', ja: '読み込み中' } }),
    html: ({
      data: { texts },
      props: { lang },
      template,
      unsafeHtml,
      attributes: { statusLiveRegion }
    }) =>
      template`<p ${statusLiveRegion}>${texts[lang]}</p><div aria-hidden="true">${unsafeHtml(Loader)}</div>`,
    css: {
      p: forScreenReaders,
      div: {
        padding: cssVar('xs'),
        marginInline: 'auto',
        svg: {
          ...spin(1.5),
          display: 'flex',
          width: cssVar('2xl'),
          height: 'auto',
          stroke: white()
        }
      }
    }
  })
