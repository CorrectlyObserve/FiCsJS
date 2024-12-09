import { fics } from 'ficsjs'

interface Data {
  value: string
  isComposing: boolean
}

interface Props {
  placeholder: string
  enter: () => void
}

export default fics<Data, Props>({
  name: 'input',
  data: () => ({ value: '', isComposing: false }),
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
      handler: 'compositionstart',
      selector: 'input',
      method: ({ $setData }) => $setData('isComposing', true)
    },
    {
      handler: 'compositionend',
      selector: 'input',
      method: ({ $setData }) => $setData('isComposing', false)
    },
    {
      handler: 'keydown',
      selector: 'input',
      method: ({ $data: { value, isComposing }, $props: { enter }, $event }) => {
        if ((value !== '' && ($event as KeyboardEvent).key) === 'Enter' && !isComposing) enter()
      },
      options: { throttle: 500 }
    }
  ]
})
