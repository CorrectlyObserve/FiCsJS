import { fics, type FiCs } from 'ficsjs'
import { rect, size } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  svg: string
  ariaLabel: string
  isPressed?: boolean
  color?: string
  click?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel, svg, isPressed },
  template,
  unsafeHtml,
  attributes: { boolean }
}) => template`
  <button
    aria-label="${ariaLabel}"
    ${isPressed === undefined ? '' : `aria-pressed="${boolean(isPressed)}"`}
    type="button"
  >${unsafeHtml(svg)}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { color }, cssToString }) => `
  button[type="button"] {
    background: none;
    color: ${color ?? white()};
    padding: ${size(2)};

    &:hover { background: ${white(0.1)}; }
    &:focus-visible { outline-color: ${color ?? white()}; }

    svg {
      ${cssToString(rect(8))}
      display: flex;
      stroke: currentColor;
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: { click: [({ props: { click } }) => click?.(), { throttleMs: 500, blur: true }] }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, actions })
