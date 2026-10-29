import { fics, type FiCs } from 'ficsjs'
import {
  color,
  fill,
  flex,
  maskIcon,
  space,
  size,
  textSize,
  radius,
  interactive
} from 'ficsjs/style'
import { ChevronDown } from 'lucide-static'

interface Data {
  readonly id: string
  readonly describedBy: string
  value: string
}

export interface Props {
  id: string
  label: string
  placeholder: string
  options: readonly { value: string; text: string }[]
  hint?: string
  isRequired?: boolean
  change: (value: string) => void
}

const html: FiCs.Html<Data, Props> = ({
  data: { describedBy, value },
  props: { id, label, options, placeholder, hint, isRequired },
  form: { isDisabled },
  template,
  attributes: {
    a11y: { ariaHidden },
    disabled,
    required
  }
}) => template`
  <div>
    <label for="${id}">${label}${isRequired && template`<span ${ariaHidden}>Required</span>`}</label>
    <span>
      <select
        id="${id}"
        ${hint && `aria-describedby="${id}-${describedBy}"`}
        ${disabled(isDisabled)}
        ${required(isRequired)}
      >
        ${[{ value: '' as const, text: placeholder }, ...options].map(
          ({ value: v, text }) =>
            template`
              <option value="${v}" key="${v}" ${v === '' && 'disabled hidden'} ${v === value && 'selected'}>
                ${text}
              </option>
            `
        )}
      </select>
    </span>
    <p>${hint && template`<small id="${id}-${describedBy}" class="hint">${hint}</small>`}</p>
  </div>
`

const css: FiCs.Css<Data, Props> = `
  :host { 
    width: min(100%, ${size(80)});
    
    div {
      ${flex({ direction: 'column', gap: space('sm') })}

      label, p { text-align: start; }

      label > span {
        ${fill('danger')};
        ${textSize('xs')};
        ${radius('sm')};
        padding-block: ${space('xs')};
        padding-inline: ${space('xs')};
        margin-left: ${space('xs')};
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

          &:not(:disabled) { ${interactive({ hover: base => `${base} cursor: pointer;`, active: false })} }
          &:has(option[value='']:checked) { color: ${color('text-muted')}; }
        }
      }
    }
  }  
`

const actions: FiCs.Actions<Data, Props> = {
  select: {
    change: ({ data, props: { change }, value }) => {
      data.value = value ?? ''
      change(data.value)
    }
  }
}

const options: FiCs.Options<Data, Props> = {
  form: {
    value: ({ data }) => data.value,
    validate: ({ data, props: { placeholder, isRequired } }) =>
      isRequired && data.value === '' ? placeholder : null,
    reset: ({ data }) => (data.value = '')
  }
}

export default () =>
  fics<Data, Props>({
    name: 'select',
    data: () => ({ id: 'control', describedBy: 'hint', value: '' }),
    attributes: ({ props: { id } }) => ({ name: id }),
    html,
    css,
    actions,
    options
  })
