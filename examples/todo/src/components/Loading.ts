import { fics, type FiCs } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { forScreenReaders, rect, size } from 'ficsjs/style'
import { white } from '@/styles/theme'
import { Loader } from 'lucide-static'

interface Props {
  text: string
}

const html: FiCs.Html<{}, Props> = ({
  props: { text },
  template,
  unsafeHtml,
  attributes: { statusLiveRegion }
}) => template`
  <p ${statusLiveRegion}>${text}</p>
  <div aria-hidden="true">${unsafeHtml(Loader)}</div>
`

const css: FiCs.Css<{}, Props> = `
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

export default () => fics<{}, Props>({ name: 'loading', html, css })
