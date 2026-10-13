import { fics, type FiCs } from 'ficsjs'
import { cssVar, oklch, rect, size, textSize } from 'ficsjs/style'
import { white } from '@/styles/theme'

interface Props {
  isDisabled?: boolean
  state?: 'pressed' | 'expanded'
  type?: 'gradation' | 'selected' | 'delete'
  svg?: string
  fixedUnit?: number
  buttonText: string
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { isDisabled, state, type, svg, buttonText },
  template,
  unsafeHtml,
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
  >${svg ? template`<span ${ariaHidden}>${unsafeHtml(svg)}</span>` : ''}${buttonText}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { fixedUnit } }) => `
  :host {
    text-align: center;

    button {
      ${textSize('base', true)}
      ${fixedUnit ? `width: ${size(fixedUnit)};` : ''}
      min-width: ${size(16)};
      padding: ${size(4)};

      &[disabled] {
        background: none !important;
        color: ${white(0.2)};
        cursor: not-allowed;
      }

      &:not([disabled]):active { scale: 0.95; }

      &[data-type="gradation"] {
        position: relative;
        background: ${cssVar('gradation')};
        padding-inline: ${size(4)};
        overflow: hidden;
        z-index: 0;

        &::before {
          position: absolute;
          content: '';
          inset: 0;
          background: ${cssVar('black')};
          opacity: 0;
          transition: ${cssVar('transition')};
          z-index: -1;
        }

        &:not([disabled]):hover::before { opacity: 0.5; }
      }

      &[data-type="selected"], &[data-type="delete"] {
        color: ${cssVar('red')};
        text-underline-offset: ${cssVar('outline')};

        &:not([disabled]):hover {
          background: ${oklch(cssVar('red'), { opacity: 0.3 })};
          color: ${white()};
        }
      }

      &[data-type="selected"] {
        font-weight: bold;
        text-decoration: underline;
      }

      &:has(span) {
        display: inline-flex;
        align-items: center;
        gap: ${size(2)};
        padding-block: ${size(3)};

        svg { ${rect(6)}; display: flex; }
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
