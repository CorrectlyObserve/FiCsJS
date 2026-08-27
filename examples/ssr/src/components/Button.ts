import { fics, type FiCs } from 'ficsjs'
import { white } from '@/utils'

interface Props {
  isDisabled: boolean
  isCurrent?: boolean
  buttonText: string
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { isDisabled, isCurrent, buttonText },
  template,
  isBrowser
}) => template`
  <button
    class="clickable w-24 text-white border border-white p-3 rounded-lg"
    ${!isBrowser || isDisabled ? 'disabled' : ''}
    ${isCurrent ? 'aria-current="page"' : ''}
    type="button"
  >${buttonText}</button>
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
