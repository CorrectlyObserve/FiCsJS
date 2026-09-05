import { fics, type FiCs } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { forScreenReaders, rect, size } from 'ficsjs/style'
import type { Lang } from '@/utils/lang'
import { white } from '@/utils/others'
import { Loader } from 'lucide-static'

interface Data {
  texts: Record<Lang, string>
}

interface Props {
  lang: Lang
}

const html: FiCs.Html<Data, Props> = ({
  data: { texts },
  props: { lang },
  template,
  unsafeHtml,
  attributes: { statusLiveRegion }
}) => template`
  <p ${statusLiveRegion}>${texts[lang]}</p>
  <div aria-hidden="true">${unsafeHtml(Loader)}</div>
`

const css: FiCs.Css<Data, Props> = `
  p {${forScreenReaders}}

  div {
    padding: ${size(2)};
    margin-inline: auto;

    svg {
      ${rect(16)}${spin()}
      display: flex;
      stroke: ${white()};
    }
  }
`

export default () =>
  fics<Data, Props>({
    name: 'loading',
    data: () => ({ texts: { en: 'Loading...', ja: '読み込み中' } }),
    html,
    css
  })
