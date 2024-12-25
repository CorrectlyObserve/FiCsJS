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
  actions: [
    {
      handler: 'input',
      selector: 'textarea',
      method: ({ props: { input }, value }) => input(value!),
      options: { debounce: 200 }
    },
    {
      handler: 'blur',
      selector: 'textarea',
      method: ({ props: { value, blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  ]
})
