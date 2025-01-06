import { fics } from 'ficsjs'
import { variable } from 'ficsjs/css'

interface Props {
  id?: string
  label?: string
  placeholder: string
  value: string
  input: (value: string) => void
  blur?: () => void
}

export default fics<{}, Props>({
  name: 'textarea',
  html: ({ props: { id, label, placeholder, value }, template }) =>
    template`
      ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
      <textarea id="${id ?? ''}" placeholder="${placeholder}">${value}</textarea>
    `,
  css: { label: { marginBottom: variable('ex-sm') } },
  actions: {
    textarea: {
      input: [({ props: { input }, value }) => input(value!), { debounce: 200 }],
      blur: ({ props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  }
})
