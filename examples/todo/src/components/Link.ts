import { ficsLink, type FiCsLink } from 'ficsjs/router'
import { calc, forScreenReaders, size, truncate } from 'ficsjs/style'
import { white } from '@/styles/theme'

interface Props {
  href: string
  title: string
  isDone: boolean
  status: string
}

const href: FiCsLink.Href<Props> = ({ props: { href } }) => href

const content: FiCsLink.Content<Props> = ({ props: { title, isDone, status }, template }) =>
  template`
    <span${isDone && ' class="done"'}>${title}</span>
    <span style="${String(forScreenReaders)}">${status}</span>
  `

const css: FiCsLink.Css<Props> = `
  :host {
    width: ${calc(`100% - ${size(12)}`)};

    a {
      display: flex;
      color: ${white()};
      padding: ${size(4)};

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
