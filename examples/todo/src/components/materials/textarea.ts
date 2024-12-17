import { fics } from 'ficsjs'

interface Props {
  id?: string
  placeholder: string
  blur?: () => void
}

export default fics<{ value: string }, Props>({
  name: 'input',
  data: () => ({ value: '' }),
  html: ({ $data: { value }, $props: { id, placeholder }, $template }) =>
    $template`<textarea id="${id ?? ''}" value="${value}" placeholder="${placeholder}" />`,
  actions: [
    {
      handler: 'input',
      selector: 'textarea',
      method: ({ $setData, $value }) => $setData('value', $value!),
      options: { debounce: 200 }
    },
    {
      handler: 'blur',
      selector: 'textarea',
      method: ({ $data: { value }, $props: { blur } }) => {
        if (value !== '' && blur) blur()
      }
    }
  ]
})
