import { fics, type FiCs } from 'ficsjs'
import {
  color,
  cssVar,
  flex,
  fontWeight,
  interactive,
  maskIcon,
  motion,
  rect,
  size,
  space,
  stroke,
  tapSize,
  textSize
} from 'ficsjs/style'

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

      &[disabled] {
        background: none !important;
        color: ${white(0.2)};
        cursor: not-allowed;
      }

      &:not([disabled]):active { scale: 0.95; }

      &[data-type="gradation"] {
        ${interactive({
          hover: 'cursor: pointer; &::before { opacity: 0.5; }',
          active: '@media (prefers-reduced-motion: no-preference) { scale: 0.95 }'
        })}
        position: relative;
        background: ${cssVar('gradation')};
        padding-inline: ${space('md')};
        overflow: hidden;
        z-index: 0;

        &::before {
          position: absolute;
          content: '';
          inset: 0;
          background: ${cssVar('black')};
          opacity: 0;
          transition: ${motion()};
          z-index: -1;
        }

        &:not([disabled]):hover::before { opacity: 0.5; }
      }

      &[data-type="selected"], &[data-type="delete"] { text-underline-offset: ${stroke('md')}; }

      &[data-type="selected"] {
        font-weight: bold;
        text-decoration: underline;
      }

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
