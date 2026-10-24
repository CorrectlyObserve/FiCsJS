import { fics, type FiCs } from 'ficsjs'
import { calc, flex, space, srOnly, stroke, tapSize } from 'ficsjs/style'

interface Props {
  id: string
  label: string
  description: string
  placeholder: string
  value: string
  input: (value: string) => void
  blur?: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { id, label, description, placeholder, value },
  template
}) =>
  template`
    <div>
      <label for="${id}">${label}</label>
      <p id="${id}-info">${description}</p>
      <textarea id="${id}" placeholder="${placeholder}" aria-describedby="${id}-info">${value}</textarea>
    </div>
  `

const css: FiCs.Css<{}, Props> = `
  div {
    ${flex({ direction: 'column' })}

    label { padding-block-end: ${space('sm')}; }

    p { ${srOnly} }

    textarea {
      height: ${calc(`${tapSize()} + 5lh`)};
      padding-block: ${calc(`(${tapSize()} - 2 * ${stroke('sm')} - 1lh) / 2`)};
      resize: none;
    }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  textarea: {
    input: [({ props: { input }, value }) => input(value!), { debounceMs: 200 }],
    blur: ({ props: { value, blur } }) => {
      if (value !== '' && blur) blur()
    }
  }
}

export default () => fics<{}, Props>({ name: 'textarea', html, css, actions })
