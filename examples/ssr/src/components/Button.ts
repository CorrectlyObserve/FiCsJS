import { fics, type FiCs } from 'ficsjs'
import { color, space, stroke } from 'ficsjs/style'
import {
  type Placement,
  TOOLTIP_ID,
  tooltipCss,
  tooltipHandlers,
  tooltipMarkup
} from '@/components/Tooltip'

export interface Props {
  text: string
  isNotInForm?: boolean
  variant?: 'neutral' | 'danger'
  isDisabled?: boolean
  tooltip?: string
  tooltipPlacement?: Placement
  isFull?: boolean
  click?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { text, isNotInForm, variant = 'neutral', isDisabled, tooltip },
  template,
  isBrowser,
  form,
  attributes: { disabled }
}) => template`
  <button
    type="${isNotInForm ? 'button' : 'submit'}"
    data-variant="${isNotInForm ? 'neutral' : variant}"
    ${disabled(!isBrowser || isDisabled || form.isDisabled)}
    ${tooltip && `aria-describedby="${TOOLTIP_ID}"`}
  >${text}${tooltipMarkup(template, tooltip)}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { tooltipPlacement, isFull } }) => {
  const width = (isFull && `width: 100%;`) || ''

  return `
    :host { 
      display: inline-block; ${width} 

      button {
        ${width}
        ${tooltipCss(tooltipPlacement)}
        padding-inline: ${space('md')};
        border: ${stroke('sm')} solid ${color('border')};
        white-space: nowrap;

        &[data-variant='danger'] { color: ${color('danger-text')}; border-color: ${color('danger')}; }
      }
    }
  `
}

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [
      ({ props: { isNotInForm, isDisabled, click }, requestSubmit }) => {
        if (isDisabled) return

        click?.()
        !isNotInForm && requestSubmit()
      },
      { throttleMs: 500, blur: true }
    ],
    ...tooltipHandlers<{}, Props>()
  }
}

export default () =>
  fics<{}, Props>({ name: 'button', html, css, actions, options: { form: { value: () => null } } })
