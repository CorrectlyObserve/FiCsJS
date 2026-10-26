import { ficsCssVar } from '../../core/helpers'

export const tooltipAnchor = (name: string = 'tooltip'): string =>
  `anchor-name: ${ficsCssVar(name)};`
