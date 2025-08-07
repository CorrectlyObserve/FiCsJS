import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter, oklch } from 'ficsjs/style'
import { white } from '@/utils'

interface Props {
  id?: string
  label?: string
  placeholder: string
  value: string
  input: (value: string) => void
  blur?: () => void
}

const paddingY: string = calc([cssVar('xs'), 1.5], '*')

export default () =>
  fics<{}, Props>({
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
          maxWidth: calc([calc([cssVar('md'), 30], '*'), calc([cssVar('xl'), 2], '*')], '-'),
          height: calc([calc([paddingY, 2], '*'), calc([cssVar('md'), 1.5, 6], '*')], '+'),
          background: oklch(white, { opacity: 0.1 }),
          paddingBlock: paddingY,
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
