import { fics, type FiCs } from 'ficsjs'
import { oklch, size, textSize } from 'ficsjs/style'
import { black } from '@/utils/color'

type Options = { value: string; text: string }[]

interface Props {
  name: string
  label: string
  options: Options
  value: string
  change: (value: string) => void
  placeholder?: string
  description?: string
  isRequired?: boolean
}

const chevron = (color: string): string =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E")`

const toOptions = ({
  options,
  placeholder
}: {
  options: Options
  placeholder?: string
}): Options =>
  placeholder === undefined ? options : [{ value: '', text: placeholder }, ...options]

const html: FiCs.Html<{}, Props> = ({
  props: { name, label, options, value, placeholder, description, isRequired },
  form: { isDisabled },
  template
}) => template`
  <label for="${name}">
    ${label}
    <select
      id="${name}"
      ${description !== undefined && `aria-describedby="${name}-description"`}
      ${isDisabled && 'disabled'}
      ${isRequired && 'required'}
    >
      ${toOptions({ options, placeholder }).map(
        ({ value: v, text }) => template`
          <option key="${v}" value="${v}" ${v === value && 'selected'}>${text}</option>
        `
      )}
    </select>
  </label>
  ${description !== undefined && template`<p id="${name}-description">${description}</p>`}
`

const css: FiCs.Css<{}, Props> = `
  :host { 
    display: grid; gap: ${size(2)};

    label {
      display: grid; gap: ${size(2)};

      select {
        appearance: none;
        background-color: transparent;
        background-image: ${chevron('#fff')};
        background-repeat: no-repeat;
        background-position: right ${size(2)} center;
        background-size: ${size(4)};
        border: 1px solid #fff;

        &:hover { background-color: ${oklch(black, { darker: 0.05 })}; cursor: pointer; }
        &:hover, &:focus-visible {
          background-image: ${chevron('#8ac6ff')};
          color: #8ac6ff;
          border-color: #8ac6ff;
        }

        option { background: ${black} }
      }
    }

    p { ${textSize('sm')} }
  }
`

const openPicker = (select: Element | null): void => {
  if (!(select instanceof HTMLSelectElement) || !('showPicker' in select)) return

  try {
    select.showPicker()
  } catch {}
}

const actions: FiCs.Actions<{}, Props> = {
  label: {
    click: ({ event, ref }): void => {
      if (event.target !== event.currentTarget) return
      openPicker(ref('select'))
    }
  },
  select: {
    change: ({ props: { change }, value = '' }): void => change(value),
    keydown: ({ event }): void => {
      if ((event as KeyboardEvent).key !== 'Enter') return

      event.preventDefault()
      openPicker(event.currentTarget as Element)
    }
  }
}

export default () =>
  fics<{}, Props>({
    name: 'select',
    attributes: ({ props: { name } }) => ({ name }),
    html,
    css,
    actions,
    options: {
      form: {
        value: ({ props: { value } }) => value,
        reset: ({ props: { change, options, placeholder } }) =>
          change(toOptions({ options, placeholder })[0]?.value ?? '')
      }
    }
  })
