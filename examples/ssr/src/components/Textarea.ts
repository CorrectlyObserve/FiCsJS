import { fics, type FiCs } from 'ficsjs'
import { calc, flex, size, space, stroke, tapSize } from 'ficsjs/style'

export interface Data {
  readonly describedBy: string
}

export interface Props {
  id: string
  label: string
  placeholder: string
  value: string
  isSrOnly?: boolean
  hint?: string
  input: (value: string) => void
  keydown?: (event: KeyboardEvent) => void
}

const html: FiCs.Html<Data, Props> = ({
  data: { describedBy },
  props: { id, label, placeholder, isSrOnly, hint, value },
  template,
  attributes: {
    a11y: { srOnly }
  }
}) => template`
  <div>
    <label for="${id}" ${isSrOnly && srOnly}>${label}</label>
    <textarea
      id="${id}"
      placeholder="${placeholder}"
      ${hint && `aria-describedby="${id}-${describedBy}"`}
    >${value}</textarea>
    ${hint && template`<small id="${id}-${describedBy}">${hint}</small>`}
  </div>
`

const css: FiCs.Css<Data, Props> = `
  :host { 
    width: min(100%, ${size(80)});

    div {
      ${flex({ direction: 'column', gap: space('sm') })}

      textarea {
        height: ${calc(`${tapSize()} + 3lh`)};
        padding-block: ${calc(`(${tapSize()} - 2 * ${stroke('sm')} - 1lh) / 2`)};
        resize: none;
      }
    }
  }
`

const actions: FiCs.Actions<Data, Props> = {
  textarea: {
    input: ({ props: { input }, value }) => input(value ?? ''),
    keydown: ({ props: { keydown }, event }) => keydown?.(event as KeyboardEvent)
  }
}

export default () =>
  fics<Data, Props>({
    name: 'textarea',
    data: () => ({ describedBy: 'hint' }),
    attributes: ({ props: { id } }) => ({ name: id }),
    html,
    css,
    actions
  })
