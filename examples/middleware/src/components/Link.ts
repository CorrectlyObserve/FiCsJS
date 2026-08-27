import { fics, type FiCs } from 'ficsjs'
import { flexCenter, size } from 'ficsjs/style'

interface Props {
  href: string
  text: string
}

const html: FiCs.Html<{}, Props> = ({ props: { href, text }, template }) => {
  href = href.trim()

  if (href === '') throw new Error('The "href" must be a non-empty string...')
  return template`<p align="center"><a href="${href}">${text}</a></p>`
}

const css: FiCs.Css<{}, Props> = ({ cssToString }) => `
  a {
    ${cssToString(flexCenter('y', { inline: true }))}
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: ${size(1)};
    line-height: inherit;
    &:visited { color: inherit; }
    &:hover, &:focus, &:focus-visible { color: #8ac6ff; }
  }
`

export default () => fics({ name: 'link', html, css })
