import { ficsCssVar, numberError } from '../../core/helpers'
import { colorMix, cssVar, toVar } from '../others'
import { COLOR_TOKENS } from './constants'
import { toTextColor } from './math'
import { adjustLightness, clampLightness, mixTowardFill } from './modifier'
import { BACKGROUND_DELTAS, BASE_COLORS, RATIOS, LIGHTNESS_CLAMP } from './tokens'
import type { Color } from './types'

const toColor = (token: keyof typeof BASE_COLORS): string =>
  toVar({ name: 'color', token, value: BASE_COLORS[token] })

const BG_BASE: readonly [string, string] = [toColor('bg-light'), toColor('bg-dark')],
  BG: string = `light-dark(${BG_BASE.join(', ')})`,
  LINK_VAR: string = ficsCssVar('link'),
  FILL_VAR: string = ficsCssVar('fill'),
  FILL: string = cssVar(FILL_VAR, BG),
  TEXT: string = toTextColor(FILL)

const COLORS = {} as Record<Color.Theme, string>,
  fadeRatio = (ratio: number = 1): string => {
    numberError({ ratio }, 'ratio')
    return `calc(100% - (${cssVar(ficsCssVar('disabled'), '0%')} * ${ratio}))`
  }

for (const token of COLOR_TOKENS) {
  switch (token) {
    case 'bg':
      COLORS[token] = colorMix({ colors: [BG], ratio: fadeRatio() })
      for (const pattern of ['sunken', 'raised'] as const)
        COLORS[`bg-${pattern}`] = colorMix({
          colors: [
            adjustLightness({
              backgrounds: BG_BASE,
              deltas: BACKGROUND_DELTAS[pattern]
            })
          ],
          ratio: fadeRatio()
        })

      break

    case 'inverse':
      COLORS[token] = colorMix({ colors: [toTextColor(BG)], ratio: fadeRatio() })
      break

    case 'text':
      COLORS[token] = colorMix({ colors: [TEXT, SURFACE], ratio: fadeRatio(0.6) })
      COLORS[`${token}-muted`] = colorMix({
        colors: [
          mixTowardFill({
            text: TEXT,
            surface: SURFACE,
            ratio: RATIOS.muted,
            isOnFill: true
          }),
          SURFACE
        ],
        ratio: fadeRatio(0.6)
      })
      break

    case 'link':
      COLORS[token] = colorMix({
        colors: [
          cssVar(LINK_VAR, clampLightness(toColor('primary'), LIGHTNESS_CLAMP.text)),
          SURFACE
        ],
        ratio: fadeRatio(0.6)
      })
      break

    case 'border':
    case 'divider':
      COLORS[token] = colorMix({
        colors: [
          mixTowardFill({
            text: TEXT,
            surface: SURFACE,
            ratio: RATIOS[token],
            isOnFill: token === 'border'
          }),
          SURFACE
        ],
        ratio: fadeRatio()
      })
      break

    case 'shadow': {
      const alphas: readonly [number, number] = [0.1, 0.4]
      COLORS[token] = colorMix({
        colors: [
          `light-dark(${BG_BASE.map((bg, i) => `oklch(from ${bg} calc(l * 0.2) c h / ${alphas[i]})`).join(', ')})`
        ],
        ratio: fadeRatio()
      })
      break
    }

    default:
      COLORS[token] = colorMix({ colors: [toColor(token)], ratio: fadeRatio() })
      COLORS[`${token}-text`] = colorMix({
        colors: [clampLightness(toColor(token), LIGHTNESS_CLAMP.text), SURFACE],
        ratio: fadeRatio(0.6)
      })
  }
}

export const color = (token: Color.Theme | 'focus'): string => {
  if (token === 'focus')
    return toVar({
      name: 'color',
      token,
      value: clampLightness(toColor('primary'), LIGHTNESS_CLAMP.graphic)
    })

  return COLORS[token]
}