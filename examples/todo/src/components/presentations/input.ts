import { fics } from 'ficsjs'

export default fics<{ value: string }, { placeholder: string; enter: () => void }>({
  name: 'input',
  data: () => ({ value: '' }),
  html: ({ $data: { value }, $props: { placeholder }, $template }) =>
    $template`<input value="${value}" placeholder="${placeholder}" type="text" />`,
  actions: [
    {
      handler: 'input',
      selector: 'input',
      method: ({ $setData, $value }) => $setData('value', $value!),
      options: { debounce: 200 }
    },
    {
      handler: 'keydown',
      selector: 'input',
      method: ({ $data: { value }, $props: { enter }, $event }) => {
        if ((value !== '' && ($event as KeyboardEvent).key) === 'Enter') enter()
      },
      options: { throttle: 500 }
    }
  ]
})
