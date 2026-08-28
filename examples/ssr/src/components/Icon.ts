import { fics, type FiCs } from 'ficsjs'
import { white } from '@/utils'

interface Props {
  svg: string
  ariaLabel: string
  isDisabled?: boolean
  isActive?: boolean
  isLarge?: boolean
  isPressed?: boolean
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { svg, ariaLabel, isDisabled, isActive, isLarge, isPressed },
  template,
  attributes: { boolean },
  unsafeHtml,
  isBrowser
}) => {
  const _isDisabled = !isBrowser || isDisabled,
    textColor = !_isDisabled && isActive ? 'text-pink' : 'text-white'

  return template`
    <button
      class="clickable flex ${textColor} ${isLarge ? 'p-4' : 'p-3'} rounded-lg"
      ${_isDisabled && 'disabled'}
      aria-label="${ariaLabel}"
      ${isPressed !== undefined && `aria-pressed="${boolean(isPressed)}"`}
      type="button"
    >${unsafeHtml(svg)}</button>
  `
}

const css: FiCs.Css<{}, Props> = ({ props: { isLarge } }) => `
  button {
    &:hover { background: ${white(0.1)}; }
    svg { width: ${isLarge ? '2.5' : '1.25'}rem; height: auto; stroke: currentColor; }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [
      ({ props: { isDisabled, click } }) => !isDisabled && click(),
      { throttleMs: 500, blur: true }
    ]
  }
}

export default () => fics<{}, Props>({ name: 'icon', className: 'icon', html, css, actions })
