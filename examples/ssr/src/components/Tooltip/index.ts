import type { FiCs } from 'ficsjs'
import { tooltip, tooltipAnchor } from 'ficsjs/style'

export { tooltipHandlers } from './actions'

export type Placement = 'top' | 'bottom' | 'left' | 'right'

export const TOOLTIP_ID = 'tooltip' as const

export const tooltipMarkup = <D extends object, P extends object>(
  template: Parameters<FiCs.Html<D, P>>[0]['template'],
  tooltip: string | undefined
) =>
  tooltip && template`<span id="${TOOLTIP_ID}" role="tooltip" aria-hidden="true">${tooltip}</span>`

export const tooltipCss = (placement: Placement = 'top'): string => `
  ${tooltipAnchor()}

  > #${TOOLTIP_ID} { ${tooltip({ placement })}; white-space: normal; }

  &:is(:hover, :focus-visible) > #${TOOLTIP_ID} { opacity: 1; visibility: visible; }
`
