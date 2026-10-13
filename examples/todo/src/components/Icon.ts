import { fics, type FiCs } from 'ficsjs'
import { cssVar, flex, rect, size } from 'ficsjs/style'
import { white } from '@/styles/theme'

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
  props: { svg, ariaLabel: label, isDisabled, state, isDraggable },
  template,
  unsafeHtml,
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
  >${unsafeHtml(svg)}</button>
`

const css: FiCs.Css<{}, Props> = ({ props: { color } }) => `
  button {
    color: ${color ?? white()};
    padding: ${size(2)};

    &:focus-visible { outline-color: currentColor; }
    
    &[aria-pressed="true"], &[aria-expanded="true"] { color: ${cssVar('red')}; }
    &[draggable="true"] { &:hover { cursor: grab; } &:active { cursor: grabbing; } }

    &[disabled] { color: ${white(0.2)}; cursor: not-allowed; }

    svg {
      ${flex()}
      ${rect(8)}
      stroke: currentColor;
    }
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
