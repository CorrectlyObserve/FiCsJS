import { fics, type FiCs } from 'ficsjs'
import { pulse } from 'ficsjs/animation'
import { color, radius } from 'ficsjs/style'

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

const css: FiCs.Css<{}, Props> = ({ props: { size } }) => `
  div {
    ${pulse()}
    width: ${size}px;
    height: ${size}px;
    background: ${color('divider')};
    border-radius: ${radius('sm')};
  }
`

export default fics<{}, Props>({ name: 'skeleton', html, css })
