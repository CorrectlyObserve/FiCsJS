import { cssObject } from '../core/helpers'

export const maskIcon = (svg: string, size: string = 'contain') =>
  cssObject({
    background: 'currentColor',
    mask: `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / ${size} no-repeat`
  } as const)
