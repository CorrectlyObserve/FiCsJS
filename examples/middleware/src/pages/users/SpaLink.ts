import { ficsLink, type FiCsLink } from 'ficsjs/router'
import { textSize } from 'ficsjs/style'

interface Props {
  href: string
  text: string
}

const href: FiCsLink.Href<Props> = ({ props: { href } }) => href
const content: FiCsLink.Content<Props> = ({ props: { text }, template }) => template`${text}`

const css: FiCsLink.Css<Props> = `
  :host {
    ${textSize('base')}
    display: inline-block;
    width: auto;
  }
`

export default () => ficsLink<Props>({ name: 'spa-link', href, content, css })
