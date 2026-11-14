import { ficsCssVar } from '../../core/helpers'

export const tooltipAnchor = (name: string = 'tooltip'): string =>
  ['name', 'scope'].reduce((acc, cur) => `${acc}anchor-${cur}: ${ficsCssVar(name)};`, '')
