import { fics, type FiCs } from 'ficsjs'
import { cssVar, rect, size } from 'ficsjs/style'
import { white } from '@/styles/theme'

interface Props {
  svg: string
  ariaLabel: string
  isPressed?: boolean
  isExpanded?: boolean
  hasPopup?: boolean
  isDraggable?: boolean
  isDisabled?: boolean
  color?: string
  click?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel, svg, isPressed, isExpanded, hasPopup, isDraggable, isDisabled },
  template,
  unsafeHtml,
  attributes: { boolean }
}) => template`
  <button
    aria-label="${ariaLabel}"
    ${isPressed === undefined ? '' : `aria-pressed="${boolean(isPressed)}"`}
    ${isExpanded === undefined ? '' : `aria-expanded="${boolean(isExpanded)}"`}
    ${hasPopup && 'aria-haspopup="menu"'}
    ${isDraggable && 'draggable="true"'}
    ${isDisabled && 'disabled'}
    type="button"
  >${unsafeHtml(svg)}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { color } }) => `
  button[type="button"] {
    background: none;
    color: ${color ?? white()};
    padding: ${size(2)};

    &[aria-pressed="true"] { color: ${cssVar('red')}; }
    &[disabled] { color: ${white(0.2)}; cursor: not-allowed; }
    &:not([disabled]):hover { background: ${white(0.1)}; }
    &:focus-visible { outline-color: ${color ?? white()}; }

    svg {
      ${rect(8)}
      display: flex;
      stroke: currentColor;
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: { click: [({ props: { click } }) => click?.(), { throttleMs: 500, blur: true }] }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, actions })
