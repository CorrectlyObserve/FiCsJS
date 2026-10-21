import { fics, type FiCs } from 'ficsjs'
import {
  color,
  flex,
  fontWeight,
  interactive,
  maskIcon,
  rect,
  size,
  space,
  stroke,
  fill,
  tapSize,
  textSize
} from 'ficsjs/style'
import { gradientColor } from '@/styles/theme'

interface Props {
  isDisabled?: boolean
  state?: 'pressed' | 'expanded'
  type?: 'gradient' | 'selected' | 'delete'
  svg?: string
  fixedUnit?: number
  buttonText: string
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { isDisabled, state, type, svg, buttonText },
  template,
  attributes: {
    a11y: { ariaHidden, ariaState, expanded },
    disabled
  }
}) => template`
  <button
    ${disabled(isDisabled)}
    ${ariaState({ state: 'pressed', isActive: state === 'pressed' })}
    ${expanded(state === 'expanded')}
    type="button"
    ${type && `data-type="${type}"`}
  >${svg && template`<span ${ariaHidden}></span>`}${buttonText}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { svg, fixedUnit } }) => `
  :host {
    text-align: center;

    button {
      ${textSize('md', true)}
      ${fixedUnit ? `width: ${size(fixedUnit)};` : ''}
      min-width: ${size(16)};
      min-height: ${tapSize()};
      padding-inline: ${space('md')};

      &[disabled] { background: none !important; }

      &[data-type="gradient"] {
        ${fill(gradientColor())}
        &[disabled] { color: ${color('text')}; }
      }

      &[data-type="selected"], &[data-type="delete"] { text-underline-offset: ${stroke('md')}; }

      &[data-type="selected"] {
        color: ${color('primary-text')};
        font-weight: ${fontWeight('bold')};
        text-decoration: underline;
      }

      &[data-type="delete"] { color: ${color('danger-text')}; }

      &:has(span) {
        ${flex({ inline: true, center: 'y', gap: space('sm') })}

        > span { ${rect(6, 6)} ${svg ? maskIcon(svg) : ''} }
      }
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [({ props: { isDisabled, click } }) => !isDisabled && click(), { throttleMs: 500 }]
  }
}

export default () => fics<{}, Props>({ name: 'button', html, css, actions })
