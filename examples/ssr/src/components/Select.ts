import { fics, type FiCs } from 'ficsjs'
import {
  color,
  cssVar,
  fill,
  flex,
  interactive,
  maskIcon,
  radius,
  size,
  space,
  textSize
} from 'ficsjs/style'
import { toValue } from './Input'
import { ChevronDown } from 'lucide-static'

interface Data {
  readonly describedBy: string
  value: string | null
  error: string | null
}

export interface Props {
  id: string
  label: string
  placeholder: string
  options: readonly { value: string; text: string }[]
  value?: string
  hint?: string
  isRequired?: boolean
  change?: (value: string) => void
}

const html: FiCs.Html<Data, Props> = ({
  data: { describedBy, value, error },
  props: { id, label, options, value: propsValue, placeholder, hint, isRequired },
  form: { isDisabled, isUserInvalid },
  template,
  attributes: {
    a11y: { ariaHidden, invalid },
    disabled,
    formAnchor,
    required,
    show
  }
}) => template`
  <div>
    <label for="${id}">${label}${isRequired && template`<span ${ariaHidden}>Required</span>`}</label>
    <span>
      <select
        id="${id}"
        ${(hint || isUserInvalid) && `aria-describedby="${id}-${describedBy}"`}
        ${disabled(isDisabled)}
        ${required(isRequired)}
        ${invalid(isUserInvalid)}
        ${formAnchor}
      >
        ${[{ value: '' as const, text: placeholder }, ...options].map(
          ({ value: v, text }) =>
            template`
              <option
                value="${v}"
                key="${v}"
                ${v === '' && `disabled ${show(true)}`}
                ${v === toValue(value, propsValue) && 'selected'}
              >${text}</option>
            `
        )}
      </select>
    </span>
    ${
      (hint || isUserInvalid) &&
      template`<small id="${id}-${describedBy}">${isUserInvalid ? error : hint}</small>`
    }
  </div>
`

const css: FiCs.Css<Data, Props> = ({ form: { isDisabled, isUserInvalid } }) => `
  :host { 
    width: ${cssVar('min-width')};
    
    div {
      ${flex({ direction: 'column', gap: space('sm') })}

      label { 
        ${flex({ center: 'y', gap: space('sm') })}
        
        > span {
          ${fill('danger')};
          ${textSize('xs')};
          ${radius('sm')};
          padding: ${space('xs')};
        }
      }

      > span {
        position: relative;

        &::after {
          ${maskIcon(ChevronDown)};
          position: absolute;
          right: ${space('md')};
          width: ${size(5)};
          color: ${color('text-muted')};
          inset-block: 0;
          pointer-events: none;
          content: '';
        }

        select {
          appearance: none;
          ${(!isDisabled && interactive({ hover: base => `${base} cursor: pointer;`, active: false })) || ''}
          ${(isUserInvalid && `border-color: ${color('border', 'danger')};`) || ''}

          &:has(option[value='']:checked) { color: ${color('text-muted')}; }
        }
      }

      ${(isUserInvalid && `small { color: ${color('text', 'danger')}; }`) || ''}
    }
  }  
`

const actions: FiCs.Actions<Data, Props> = {
  select: {
    change: ({ data, props: { change }, value }) => {
      data.value = value ?? ''
      change?.(data.value)
    }
  }
}

const options: FiCs.Options<Data, Props> = {
  form: {
    value: ({ data: { value }, props: { value: propsValue } }) => toValue(value, propsValue),
    validate: ({ data, props: { placeholder, value, isRequired } }) => {
      data.error = isRequired && toValue(data.value, value) === '' ? `${placeholder}.` : null
      return data.error
    },
    reset: ({ data, props: { value, change } }) => {
      data.value = null
      data.error = null
      change?.(toValue(data.value, value))
    }
  }
}

export default () =>
  fics<Data, Props>({
    name: 'select',
    data: () => ({ describedBy: 'hint', value: null, error: null }),
    attributes: ({ props: { id } }) => ({ name: id }),
    html,
    css,
    actions,
    options
  })
