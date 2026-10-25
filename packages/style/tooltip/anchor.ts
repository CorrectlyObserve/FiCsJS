import { ficsCssVar } from '../../core/helpers'

export const toAnchorName = (name: string = 'tooltip'): string => ficsCssVar(name)

export const tooltipAnchor = (name?: string): string => `anchor-name: ${toAnchorName(name)};`
