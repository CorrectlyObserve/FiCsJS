import { fics } from 'ficsjs'

export default fics<{ value: string }, { placeholder: string; blur?: () => void }>({
  name: 'input',
  data: () => ({ value: '' }),
  html: ({ $data: { value }, $props: { placeholder }, $template }) =>
    $template`<textarea value="${value}" placeholder="${placeholder}" />`,
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
