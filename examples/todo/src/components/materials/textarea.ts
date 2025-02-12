import { fics } from 'ficsjs'
import { calc, color, variable } from 'ficsjs/style'
import { white } from '@/utils'

interface Props {
  id?: string
  label?: string
  placeholder: string
  value: string
  input: (value: string) => void
  blur?: () => void
}

const lineHeight = 1.5
const paddingY: string = calc([variable('xs'), 1.5], '*')

export default () =>
  fics<{}, Props>({
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
          maxWidth: calc([calc([variable('md'), 30], '*'), calc([variable('xl'), 2], '*')], '-'),
          height: calc([calc([paddingY, 2], '*'), calc([variable('md'), lineHeight, 6], '*')], '+'),
          background: color({ hex: white, rate: 0.1 }),
          fontSize: variable('md'),
          color: white,
          padding: `${paddingY} ${variable('md')}`,
          borderRadius: variable('xs'),
          border: 'none',
          outline: 'none',
          lineHeight,
          resize: 'none',
          '&:hover': { cursor: 'pointer' },
          '&:focus': {
            background: color({ hex: white, rate: 0.8 }),
            color: variable('black'),
            cursor: 'auto'
          }
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
