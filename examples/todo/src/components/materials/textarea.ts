import { fics } from 'ficsjs'

interface Props {
  id?: string
  value: string
  placeholder: string
  input: (value: string) => void
  blur?: () => void
}

export default fics<{}, Props>({
  name: 'textarea',
  html: ({ props: { id, value, placeholder }, template }) =>
    template`<textarea id="${id ?? ''}" placeholder="${placeholder}">${value}</textarea>`,
  actions: {
    textarea: {
      input: [({ props: { input }, value }) => input(value!), { debounce: 200 }],
      blur: ({ props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  }
})
