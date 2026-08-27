import { fics, type FiCs } from 'ficsjs'
import { calc, flexCenter, forScreenReaders, size } from 'ficsjs/style'

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

const css: FiCs.Css<{}, Props> = ({ cssToString }) => `
  div {
    ${cssToString(flexCenter('x', { direction: 'column' }))}

    label { padding-block-end: ${size(2)}; }

    p {${cssToString(forScreenReaders)}}

    textarea {
      height: ${calc(`${size(3)} + ${size(6 * 6)} + ${size(3)}`)};
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

export default fics<{}, Props>({ name: 'textarea', html, css, actions })
