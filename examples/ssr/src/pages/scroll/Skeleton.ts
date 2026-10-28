import { fics, type FiCs } from 'ficsjs'
import { pulse } from 'ficsjs/animation'
import { fill, radius } from 'ficsjs/style'

interface Props {
  size: number
  radius: 'full' | 'lg' | 'none' | 'sm'
}

const html: FiCs.Html<{}, Props> = ({
  template,
  attributes: {
    a11y: { ariaHidden }
  }
}) => template`<div ${ariaHidden}></div>`

const css: FiCs.Css<{}, Props> = ({ props: { size, radius: r } }) => `
  div {
    ${fill('divider')};
    ${radius(r)};
    ${pulse()};
    width: ${size}px;
    height: ${size}px;
  }
`

export default fics<{}, Props>({ name: 'skeleton', html, css })
