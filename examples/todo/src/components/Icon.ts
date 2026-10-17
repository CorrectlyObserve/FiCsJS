import { fics, type FiCs } from 'ficsjs'
import { color as colorOf, flex, interactive, maskIcon, rect, tapSize } from 'ficsjs/style'

interface Props {
  svg: string
  ariaLabel: string
  isDisabled?: boolean
  state?: 'pressed' | 'expanded'
  isPressed?: boolean
  isExpanded?: boolean
  isDraggable?: boolean
  isFocused?: boolean
  color?: string
  click?: (event: MouseEvent) => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel: label, isDisabled, state, isDraggable },
  template,
  attributes: {
    a11y: { ariaLabel, ariaState, expanded },
    disabled
  }
}) => template`
  <button
    ${ariaLabel(label)}
    ${disabled(isDisabled)}
    ${ariaState({ state: 'pressed', isActive: state === 'pressed' })}
    ${expanded(state === 'expanded')}
    ${isDraggable && 'draggable="true"'}
    type="button"
  ><span></span></button>
`

const css: FiCs.Css<{}, Props> = ({ props: { color, svg } }) => `
  button {
    ${flex({ center: 'xy' })};
    ${interactive({ focusVisible: 'outline-color: currentColor;' })}
    min-width: ${tapSize()};
    min-height: ${tapSize()};

    &:focus-visible { outline-color: currentColor; }
    
    &[aria-pressed="true"], &[aria-expanded="true"] { color: ${cssVar('red')}; }
    &[draggable="true"] { &:hover { cursor: grab; } &:active { cursor: grabbing; } }

    > span { ${rect(8, 8)}; ${maskIcon(svg)}; }
  }
`

const hooks: FiCs.Hooks<{}, Props> = {
  rerendered: ({ props: { isFocused }, changedKeys: { props: changedProps }, ref }) => {
    if (!isFocused || !changedProps.includes('isFocused')) return

    const button: Element | null = ref('button')
    if (button instanceof HTMLElement) button.focus()
  }
}

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [({ props: { click }, event }) => click?.(event as MouseEvent), { throttleMs: 500 }]
  }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, hooks, actions })
