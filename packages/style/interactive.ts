import { convertStr, CSS_LAYER, DISABLED_SELECTOR } from '../core/helpers'
import { motion } from './motion'
import { colorMix, cssVar } from './others'
import type { Interactive } from './types'

const tintBackground = (ratio: number): string => {
    const tint: string = colorMix({ colors: [cssVar(TINT_VAR, 'currentColor')], ratio })
    return `background-image: linear-gradient(${tint}, ${tint}), ${cssVar(FILL_GRADIENT_VAR, 'none')};`
  },
  /** @remarks `active` wins over `hover` as they are written out in this order. */
  STATES = {
    hover: { default: `${tintBackground(0.1)} cursor: pointer;`, enabledOnly: true },
    active: {
      default: `${tintBackground(0.15)} @media (prefers-reduced-motion: no-preference) { scale: 0.95 }`,
      enabledOnly: true
    },
    focusVisible: { default: false, enabledOnly: false }
  } as const

export const interactive = (ctx: { [K in keyof typeof STATES]?: Interactive } = {}): string =>
  [
    `${CSS_LAYER} { transition: ${motion()}; }`,
    ...Object.entries(STATES).map(([key, { default: def, enabledOnly }]) => {
      const value: Interactive | undefined = ctx[key as keyof typeof STATES],
        cssValue: string | false = typeof value === 'function' ? value(def || '') : (value ?? def)

      if (typeof cssValue !== 'string') return null

      const pseudo: string = convertStr(key, 'kebab'),
        selector: string = `&${enabledOnly ? `:not(${DISABLED_SELECTOR})` : ''}`,
        css: string = `${selector}:${pseudo} { ${cssValue} }`

      return key === 'hover' ? `@media (hover: hover) { ${css} }` : css
    })
  ]
    .filter(Boolean)
    .join(' ')
