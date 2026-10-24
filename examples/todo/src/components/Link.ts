import { ficsLink, type FiCsLink } from 'ficsjs/router'
import { color, flex, interactive, radius, space, srOnly, tapSize, truncate } from 'ficsjs/style'

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
    ${textForScreenReaders && template`<span style="${String(srOnly)}">${textForScreenReaders}</span>`}
  `

const css: FiCsLink.Css<Props> = ({ props: { textForScreenReaders } }) => `
  :host {
    min-width: 0;

    a {
      ${interactive({ focusVisible: `color: inherit; outline-color: ${color('text')};` })}
      border-radius: ${radius('sm')};

      ${
        textForScreenReaders === undefined
          ? `
            padding-block: ${space('xs')};
            padding-inline: ${space('sm')};
          `
          : `
            ${flex({ center: 'y' })}
            min-height: ${tapSize()};
            color: ${color('text')};
            padding-inline: ${space('md')};
            line-height: 1;

            span {
              ${truncate()}
              width: 100%;
              line-height: inherit;

              &.struck-through { text-decoration: line-through; }
            }
          `
      }
    }
  }
`

export default () => ficsLink<Props>({ href, content, css })
