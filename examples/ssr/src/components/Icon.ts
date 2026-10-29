import { fics, type FiCs } from 'ficsjs'
import { maskIcon, rect, tapSize } from 'ficsjs/style'

export interface Props {
  svg: string
  ariaLabel: string
  isDisabled?: boolean
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel, isDisabled },
  template,
  isBrowser,
  attributes: { disabled }
}) => template`
  <button type="button" aria-label="${ariaLabel}" ${disabled(!isBrowser || isDisabled)}>
    <span></span>
  </button>
`

const css: FiCs.Css<{}, Props> = ({ props: { svg } }) =>
  `button > span { ${rect(8, 8)}; ${maskIcon(svg)}; }`

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [
      ({ props: { isDisabled, click } }) => !isDisabled && click(),
      { throttleMs: 500, blur: true }
    ]
  }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, actions })
