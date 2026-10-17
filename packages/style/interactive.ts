import { convertStr, DISABLED_SELECTOR } from '../core/helpers'
import { colorMix } from './others'

const createLayer = (ratio: number): string => {
    const tint: string = colorMix({ ratio })
    return `background-image: linear-gradient(${tint}, ${tint});`
  },
  /** @remarks `active` wins over `hover` as they are written out in this order. */
  STATES = {
    hover: { default: `${createLayer(0.1)} cursor: pointer;`, enabledOnly: true },
    active: {
      default: `${createLayer(0.15)} @media (prefers-reduced-motion: no-preference) { scale: 0.95 }`,
      enabledOnly: true
    },
    focusVisible: { default: false, enabledOnly: false }
  } as const

export const interactive = (ctx: { [K in keyof typeof STATES]?: string | false } = {}): string =>
  Object.entries(STATES)
    .map(([key, { default: def, enabledOnly }]) => {
      const cssValue: string | false = ctx[key as keyof typeof STATES] ?? def
      if (typeof cssValue !== 'string') return null

      const pseudo: string = convertStr(key, 'kebab'),
        selector: string = `&${enabledOnly ? `:not(${DISABLED_SELECTOR})` : ''}`,
        css: string = `${selector}:${pseudo} { ${cssValue} }`

      return key === 'hover' ? `@media (hover: hover) { ${css} }` : css
    })
    .filter(Boolean)
    .join(' ')
