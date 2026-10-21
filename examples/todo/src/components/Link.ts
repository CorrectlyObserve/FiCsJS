import { ficsLink, type FiCsLink } from 'ficsjs/router'
import { flex, forScreenReaders, size, truncate } from 'ficsjs/style'
import { white } from '@/styles/theme'

interface Props {
  href: string
  text: string
  isStruckThrough?: boolean
  textForScreenReaders?: string
}

const href: FiCsLink.Href<Props> = ({ props: { href } }) => href

const content: FiCsLink.Content<Props> = ({
  props: { text, isStruckThrough, textForScreenReaders },
  template
}) =>
  template`
    <span${isStruckThrough && ' class="struck-through"'}>${text}</span>
    ${textForScreenReaders && template`<span style="${String(forScreenReaders)}">${textForScreenReaders}</span>`}
  `

const css: FiCsLink.Css<Props> = `
  :host {
    min-width: 0;

    a {
      ${flex()}
      color: ${white()};
      padding: ${size(4)};
      line-height: 1;

      span {
        ${truncate()}
        width: 100%;
        line-height: inherit;

        &.done { text-decoration: line-through; }
      }
    }
  }
`

export default () => ficsLink<Props>({ href, content, css })
