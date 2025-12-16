import { fics } from 'ficsjs'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  id?: string
  label?: string
  isError?: boolean
  error: string
  value: string
  placeholder: string
  input: (value: string) => void
  enterKey?: () => void
  blur?: () => void
}

export default () =>
  fics<{ isComposing: boolean }, Props>({
    name: 'input',
    data: () => ({ isComposing: false }),
    className: 'input',
    html: ({
      props: { id, label, isError, error, value, placeholder },
      template,
      show
    }) => template`
      <div>
        ${label ? template`<label for="${id ?? ''}">${label}</label>` : ''}
        <p ${show(!!isError)}>${error}</p>
        <input
          name="${label ?? 'input'}"
          id="${id ? `id="${id}"` : ''}"
          value="${value}"
          placeholder="${placeholder}"
          type="text"
        />
      </div>
    `,
    css: {
      div: ({ props: { isError } }) => ({
        ...flexCenter('x', 'column'),
        label: { paddingBottom: cssVar('xs') },
        p: {
          fontSize: cssVar('sm'),
          color: cssVar('error'),
          marginBottom: cssVar('xs'),
          textAlign: 'left'
        },
        input: {
          background: isError ? cssVar('error') : white(0.1),
          paddingBlock: calc(`${cssVar('xs')} * 1.5`),
          '&::placeholder': isError ? { color: white(), opacity: 0.5 } : {}
        }
      })
    },
    actions: {
      input: {
        input: [({ props: { input }, value }) => input(value!), { debounce: 200 }],
        compositionstart: ({ data }) => {
          data.isComposing = true
        },
        compositionend: ({ data }) => {
          data.isComposing = false
        },
        keydown: [
          ({ data: { isComposing }, props: { value, enterKey }, event }) => {
            if (
              (value !== '' && (event as KeyboardEvent).key) === 'Enter' &&
              !isComposing &&
              enterKey
            )
              enterKey()
          },
          { throttle: 500 }
        ],
        blur: ({ props: { value, blur } }) => {
          if (value !== '' && blur) blur()
        }
      }
    }
  })
