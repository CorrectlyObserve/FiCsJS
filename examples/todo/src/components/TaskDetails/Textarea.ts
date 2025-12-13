import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import { white } from '@/utils/others'

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
  html: ({ props: { id, label, placeholder, value }, template }) => template`
    <div>
      ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
      <textarea id="${id ?? ''}" placeholder="${placeholder}">${value}</textarea>
    </div>
  `,
  css: {
    div: {
      ...flexCenter('x', 'column'),
      label: { paddingBottom: cssVar('xs') },
      textarea: {
        height: calc('+', calc('*', cssVar('xs'), 1.5, 2), calc('*', cssVar('md'), 1.5, 6)),
        background: white(0.1),
        paddingBlock: calc(`${cssVar('xs')} * 1.5`),
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
