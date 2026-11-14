import { fics, type FiCs } from 'ficsjs'
import { cssVar, flex, space, stroke, tapSize } from 'ficsjs/style'
import { toValue } from './Input'

interface Data {
  readonly describedBy: string
  value: string | null
}

interface Props {
  id: string
  label: string
  placeholder: string
  value?: string
  hint?: string
  isSrOnly?: boolean
  input?: (value: string) => void
}

const html: FiCs.Html<Data, Props> = ({
  data: { describedBy, value },
  props: { id, label, placeholder, value: propsValue, isSrOnly, hint },
  form: { isDisabled },
  template,
  attributes: {
    a11y: { srOnly },
    disabled,
    formAnchor
  }
}) => template`
  <div>
    <label for="${id}" ${isSrOnly && srOnly}>${label}</label>
    <textarea
      id="${id}"
      placeholder="${placeholder}"
      ${hint && `aria-describedby="${id}-${describedBy}"`}
      ${disabled(isDisabled)}
      ${formAnchor}
    >${toValue(value, propsValue)}</textarea>
    ${hint && template`<small id="${id}-${describedBy}">${hint}</small>`}
  </div>
`

const css: FiCs.Css<Data, Props> = `
  :host {
    width: ${cssVar('min-width')};

    div {
      ${flex({ direction: 'column', gap: space('sm') })}

      textarea {
        height: calc(${tapSize()} + 3lh);
        padding-block: calc((${tapSize()} - 2 * ${stroke('sm')} - 1lh) / 2);
        resize: none;
      }
    }
  }
`

const actions: FiCs.Actions<Data, Props> = {
  textarea: {
    input: ({ data, props: { input }, value }) => {
      data.value = value ?? ''
      input?.(data.value)
    },
    keydown: ({ event, requestSubmit }) => {
      const { key, shiftKey }: KeyboardEvent = event as KeyboardEvent
      if (key !== 'Enter' || !shiftKey || window.matchMedia('(pointer: coarse)').matches) return

      event.preventDefault()
      requestSubmit()
    }
  }
}

const options: FiCs.Options<Data, Props> = {
  form: {
    value: ({ data: { value }, props: { value: propsValue } }) => toValue(value, propsValue),
    reset: ({ data, props: { value, input } }) => {
      data.value = null
      input?.(toValue(data.value, value))
    }
  }
}

export default () =>
  fics<Data, Props>({
    name: 'textarea',
    data: () => ({ describedBy: 'hint', value: null }),
    attributes: ({ props: { id } }) => ({ name: id }),
    html,
    css,
    actions,
    options
  })
