import { size } from 'ficsjs/style'

export const columnWidth = size(120 - 16)

export const headerHeight = size(8 + 10)

export const isExpanded = (): boolean =>
  getComputedStyle(document.documentElement).getPropertyValue('--fics-layout') === 'expanded'
