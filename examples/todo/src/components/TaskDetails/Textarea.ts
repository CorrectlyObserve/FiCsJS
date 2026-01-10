import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter, forScreenReaders } from 'ficsjs/style'

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
  css: {
    div: {
      ...flexCenter('x', 'column'),
      label: { paddingBottom: cssVar('xs') },
      p: forScreenReaders,
      textarea: {
        height: calc('+', calc('*', cssVar('xs'), 1.5, 2), calc('*', cssVar('md'), 1.5, 6)),
        resize: 'none'
      }
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
