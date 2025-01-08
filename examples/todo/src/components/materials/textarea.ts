import { fics } from 'ficsjs'
import { calc, variable } from 'ficsjs/css'

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
  css: {
    label: { marginBottom: variable('ex-sm') },
    textarea: {
      height: calc([calc([variable('ex-sm'), 2], '*'), calc([variable('lg'), 1.2, 6], '*')], '+'),
      lineHeight: 1.2,
      resize: 'none'
    }
  },
  actions: {
    textarea: {
      input: [({ props: { input }, value }) => input(value!), { debounce: 200 }],
      blur: ({ props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  }
})
