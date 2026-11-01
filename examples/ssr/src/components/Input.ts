import { fics, type FiCs } from 'ficsjs'
import { color, flex, size } from 'ficsjs/style'

interface Data {
  readonly describedBy: string
  value: string | null
  error: string | null
}

interface Props {
  id: string
  label: string
  placeholder: string
  value?: string
  type?: string
  input?: (value: string) => void
  validate?: (value: string) => string | null
}

export const toValue = (value: Data['value'], propsValue: Props['value']): string =>
  value ?? propsValue ?? ''

const html: FiCs.Html<Data, Props> = ({
  data: { describedBy, value, error },
  props: { id, label, value: propsValue, type, placeholder },
  form: { isDisabled, isUserInvalid },
  template,
  attributes: {
    a11y: { invalid },
    disabled,
    formAnchor
  }
}) => template`
  <div>
    <label for="${id}">${label}</label>
    <input
      id="${id}"
      placeholder="${placeholder}"
      value="${toValue(value, propsValue)}"
      type="${type ?? 'text'}"
      ${isUserInvalid && `aria-describedby="${id}-${describedBy}"`}
      ${disabled(isDisabled)}
      ${invalid(isUserInvalid)}
      ${formAnchor}
    />
    ${isUserInvalid && template`<small id="${id}-${describedBy}" role="alert">${error}</small>`}
  </div>
`

const css: FiCs.Css<Data, Props> = ({ form: { isUserInvalid } }) => `
  :host { 
    width: min(100%, ${size(80)});
    
    div { 
      ${flex({ direction: 'column' })}
      ${
        (isUserInvalid &&
          `
            input { 
              border-color: ${color('danger')};

              + small { color: ${color('danger-text')}; }
            }
          `) ||
        ''
      }
    }
  }
`

const actions: FiCs.Actions<Data, Props> = {
  input: {
    input: ({ data, props: { input }, value }) => {
      data.value = value ?? ''
      input?.(data.value)
    },
    keydown: ({ event, requestSubmit }): void => {
      if ((event as KeyboardEvent).key === 'Enter') requestSubmit()
    }
  }
}

const options: FiCs.Options<Data, Props> = {
  form: {
    value: ({ data: { value }, props: { value: propsValue } }) => toValue(value, propsValue),
    validate: ({ data, props: { value, validate } }) => {
      data.error = validate?.(toValue(data.value, value)) ?? null
      return data.error
    },
    reset: ({ data, props: { value, input } }) => {
      data.value = null
      data.error = null
      input?.(toValue(data.value, value))
    }
  }
}

export default () =>
  fics<Data, Props>({
    name: 'input',
    data: () => ({ describedBy: 'hint', value: null, error: null }),
    attributes: ({ props: { id } }) => ({ name: id }),
    html,
    css,
    actions,
    options
  })
