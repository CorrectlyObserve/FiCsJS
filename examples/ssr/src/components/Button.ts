import { fics, type FiCs } from 'ficsjs'
import { white } from '@/utils'

export interface Props {
  text: string
  type?: 'button' | 'submit'
  variant?: 'neutral' | 'danger'
  isDisabled?: boolean
  tooltip?: string
  tooltipPlacement?: Placement
  isFull?: boolean
  click?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { text, type = 'button', variant = 'neutral', isDisabled, tooltip },
  template,
  isBrowser,
  form,
  attributes: { disabled }
}) => template`
  <button
    type="${type}"
    data-variant="${type === 'button' ? 'neutral' : variant}"
    ${disabled(!isBrowser || isDisabled || form.isDisabled)}
    ${tooltip && `aria-describedby="${TOOLTIP_ID}"`}
  >${text}${tooltipMarkup(template, tooltip)}</button>
`

const css: FiCs.Css<{}, Props> = `
  button {
    &:not([disabled]):hover { background: ${white(0.1)}; }
    &[aria-current="page"] { color: ${white(0.5)}; border-color: ${white(0.5)}; }
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

export default () => fics<{}, Props>({ name: 'button', html, css, actions })
