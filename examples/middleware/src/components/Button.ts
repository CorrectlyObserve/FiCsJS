import { fics, type FiCs } from 'ficsjs'
import { flexCenter, oklch, textSize } from 'ficsjs/style'
import { black } from '@/utils/color'

interface Props {
  text: string
  isDisabled?: boolean
}

const html: FiCs.Html<{}, Props> = ({
  props: { text, isDisabled },
  template,
  isBrowser,
  form
}) => template`
  <button type="button" ${(!isBrowser || isDisabled || form.isDisabled) && 'disabled'}>${text}</button>
`

const css: FiCs.Css<{}, Props> = `
  :host { 
    width: fit-content;

    button {
      ${flexCenter('y')}
      ${textSize('base', true)}
      background: none;
      border: 1px solid #fff;

      &:disabled {
        border-width: 0;
        cursor: not-allowed;
        opacity: 0.8;
      }

      &:not([disabled]) {
        &:hover { background: ${oklch(black, { darker: 0.05 })}; cursor: pointer; }
        &:hover, &:focus-visible { color: #8ac6ff; border-color: #8ac6ff; }
      }
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: { click: ({ requestSubmit }): void => requestSubmit() }
}

export default () =>
  fics<{}, Props>({
    name: 'button',
    className: 'button',
    html,
    css,
    actions,
    options: { form: { value: () => null } }
  })
