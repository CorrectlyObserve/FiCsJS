import { fics } from 'ficsjs'
import { cssVar, flexCenter, forScreenReaders } from 'ficsjs/style'

interface Props {
  id: string
  label: string
  isAriaLabel?: boolean
  isError?: boolean
  error?: string
  description: string
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
      props: { id, label, isAriaLabel, isError, error, description, value, placeholder },
      template,
      show,
      attributes: { boolean }
    }) => {
      const hasError = !!(isError && error)
      return template`
        <div>
          ${!isAriaLabel ? template`<label for="${id}">${label}</label>` : ''}
          <p id="${id}-error" ${show(hasError)} role="alert" aria-live="polite">${error ?? ''}</p>
          <p id="${id}-info">${description}</p>
          <input
            id="${id}"
            value="${value}"
            placeholder="${placeholder}"
            ${isAriaLabel ? `aria-label="${label}"` : ''}
            aria-describedby="${[`${id}-info`, hasError ? `${id}-error` : ''].filter(Boolean).join(' ')}"
            aria-invalid="${boolean(hasError)}"
            ${hasError ? `aria-errormessage="${id}-error"` : ''}
            type="text"
          />
        </div>
      `
    },
    css: {
      div: ({ props: { isError, error } }) => ({
        ...flexCenter('x', 'column'),
        label: { paddingBottom: cssVar('xs') },
        p: {
          '&:first-of-type': {
            fontSize: cssVar('sm'),
            color: cssVar('red'),
            marginBottom: cssVar('xs'),
            textAlign: 'left'
          },
          '&:last-of-type': forScreenReaders
        },
        input: isError && error ? { borderColor: cssVar('red') } : {}
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
