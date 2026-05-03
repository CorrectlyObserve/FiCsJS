import { fics } from 'ficsjs'
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

export default fics<{}, Props>({
  name: 'textarea',
  html: ({ props: { id, label, description, placeholder, value }, template }) => template`
    <div>
      <label for="${id}">${label}</label>
      <p id="${id}-info">${description}</p>
      <textarea id="${id}" placeholder="${placeholder}" aria-describedby="${id}-info">${value}</textarea>
    </div>
  `,
  css: ({ cssToString }) => `
    div {
      ${cssToString(flexCenter('x', 'column'))}

      label { padding-block-end: ${size(2)}; }

      p {${cssToString(forScreenReaders)}}

      textarea {
        height: ${calc(`${size(3)} + ${size(6 * 6)} + ${size(3)}`)};
        resize: none;
      }
    }
  `,
  actions: {
    textarea: {
      input: [({ props: { input }, value }) => input(value!), { debounceMs: 200 }],
      blur: ({ props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  }
})
