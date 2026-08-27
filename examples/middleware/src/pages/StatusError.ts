import { fics, type FiCs } from 'ficsjs'
import { size } from 'ficsjs/style'
import Link from '@/components/Link'

interface Data {
  description: string
  message: string
  href: string
  text: string
}

const props: FiCs.Props<Data, {}> = {
  descendants: ({ children: { link } }) => link,
  values: ({ data: { href, text } }) => ({ href, text })
}

const html: FiCs.Html<Data, {}> = ({
  children: { link },
  data: { description, message },
  template
}) => template`
  <p align="center">${description}</p>
  ${message === '' ? '' : template`<p class="break-words" align="center">${message}</p>`}
  ${link}
`

const css: FiCs.Css<Data, {}> = `
  p {
    &:first-of-type { margin-block-end: ${size(2)}; }
    &:last-of-type { margin-block-end: ${size(4)}; }
    &.break-words { overflow-wrap: break-word; }
  }
`

export default fics<Data, {}>({
  name: 'error',
  children: [Link()],
  props,
  data: () => ({ description: '', message: '', href: '/', text: '← Back to the top page' }),
  html,
  css
})
