import { gradient, oklch, size } from 'ficsjs/style'

export const columnWidth = size(120 - 16)

export const headerHeight = size(8 + 10)

export const gradientColor = (adjust: boolean = true) =>
  gradient([[oklch('#d14344'), '30%'], oklch('#cb0078')], { deg: 30, adjust })

export const isExpanded = (): boolean =>
  getComputedStyle(document.documentElement).getPropertyValue('--fics-layout') === 'expanded'
