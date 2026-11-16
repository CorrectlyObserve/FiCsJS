import { fics, type FiCs } from 'ficsjs'
import { color, flex, space, tapSize, textSize } from 'ficsjs/style'

interface Props {
  id: string
  label: string
  isAriaLabel?: boolean
  isError?: boolean
  error?: string
  description: string
  value: string
  placeholder: string
  input: (value: string) => void
  enterKey?: () => void
  blur?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { id, label, isAriaLabel, isError, error, description, value, placeholder },
  template,
  attributes: {
    a11y: { ariaLabel, invalid, liveStatus, srOnly }
  }
}) => {
  const hasError = !!(isError && error)
  return template`
    <div>
      ${!isAriaLabel && template`<label for="${id}">${label}</label>`}
      <p id="${id}-error" ${liveStatus}>${hasError && error}</p>
      <p id="${id}-info" ${srOnly}>${description}</p>
      <input
        id="${id}"
        value="${value}"
        placeholder="${placeholder}"
        ${isAriaLabel && ariaLabel(label)}
        aria-describedby="${[`${id}-info`, hasError && `${id}-error`].filter(Boolean).join(' ')}"
        ${invalid(hasError)}
        ${hasError && `aria-errormessage="${id}-error"`}
        type="text"
      />
    </div>
  `
}

const css: FiCs.Css<{}, Props> = ({ props: { isError, error } }) => `
  div {
    ${flex({ direction: 'column' })}

    label { padding-block-end: ${space('sm')}; }

    p {
      &:first-of-type {
        ${textSize('sm')}
        color: ${color('text', 'danger')};
        text-align: start;

        &:not(:empty) { margin-block-end: ${space('sm')}; }
      }
    }

    input { height: ${tapSize()}; }

    ${isError && error ? `input { border-color: ${color('border', 'danger')}; }` : ''}
  }
`

// Inputs that just confirmed a conversion, as Safari sends that Enter after compositionend.
const confirmedInputs: WeakSet<EventTarget> = new WeakSet()

const actions: FiCs.Actions<{}, Props> = {
  input: {
    keydown: ({ props: { input, enterKey }, event }) => {
      const { key, isComposing, currentTarget } = event as KeyboardEvent
      const isAfterCompositionEnd: boolean =
        currentTarget !== null && confirmedInputs.delete(currentTarget)

      if (isComposing || isAfterCompositionEnd || key !== 'Enter') return

      const { value } = currentTarget as HTMLInputElement
      if (value === '' || !enterKey) return

      input(value)
      enterKey()
    },
    compositionend: ({ props: { input }, event: { currentTarget }, value }) => {
      if (currentTarget) confirmedInputs.add(currentTarget)
      input(value!)
    },
    input: [
      ({ props: { input }, event, value }) => {
        if (!(event as InputEvent).isComposing) input(value!)
      },
      { debounceMs: 200 }
    ],
    // Clears the mark, as Chrome and Firefox send that Enter before compositionend.
    keyup: ({ event: { currentTarget } }) => {
      if (currentTarget) confirmedInputs.delete(currentTarget)
    },
    blur: ({ props: { input, blur }, event }) => {
      const { value } = event.currentTarget as HTMLInputElement

      input(value)
      if (value !== '' && blur) blur()
    }
  }
}

export default () => fics<{}, Props>({ name: 'input', className: 'input', html, css, actions })
