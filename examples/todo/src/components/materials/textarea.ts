import { fics } from 'ficsjs'
import { calc, color, variable } from 'ficsjs/style'

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
      <div>
        ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
        <textarea id="${id ?? ''}" placeholder="${placeholder}">${value}</textarea>
      </div>
    `,
  css: {
    div: {
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      label: { paddingBottom: variable('xs') },
      textarea: {
        minWidth: calc([variable('md'), 20], '*'),
        height: calc([calc([variable('xs'), 2], '*'), calc([variable('md'), 1.2, 6], '*')], '+'),
        background: color('#fff', 0.1),
        fontSize: variable('md'),
        color: '#fff',
        padding: `${variable('sm')} ${variable('md')}`,
        borderRadius: variable('xs'),
        border: 'none',
        outline: 'none',
        lineHeight: 1.2,
        resize: 'none',
        '&:hover': { cursor: 'pointer' },
        '&:focus': { background: color('#fff', 0.8), color: variable('black'), cursor: 'auto' }
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
