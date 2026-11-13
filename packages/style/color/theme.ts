import { convertStr, CSS_LAYER, DISABLED_SELECTOR, ficsCssVar } from '../../core/helpers'
import { TINT_BASE_VAR, TINT_SCALE_VAR, TINT_VAR } from '../constants'
import { colorMix, cssVar, toVar } from '../others'
import { BG_FILLS, BLENDS, COLOR_TOKENS, DESCENDANTS_SELECTOR, MUTE_RATIO_VAR } from './constants'
import { toTextColor } from './math'
import { adjustLightness, clampLightness, fadeRatio, mixTowardFill } from './modifier'
import {
  BACKGROUND_DELTAS,
  BASE_COLORS,
  LIGHTNESS_CLAMP,
  MAIN_RATIOS,
  RATIOS,
  TEXTS
} from './tokens'
import type { Color } from './types'

const toColor = (token: keyof typeof BASE_COLORS): string =>
  toVar({ name: 'color', token, value: BASE_COLORS[token] })

const BG_BASE: readonly [string, string] = [toColor('bg-light'), toColor('bg-dark')],
  BG: string = `light-dark(${BG_BASE.join(', ')})`,
  LINK_VAR: string = ficsCssVar('link'),
  FILL_VAR: string = ficsCssVar('fill'),
  FILL: string = cssVar(FILL_VAR, BG),
  TEXT: string = toTextColor(FILL),
  FILL_VARS: Readonly<Record<string, string>> = {
    [LINK_VAR]: TEXT,
    [TINT_VAR]: `color(from ${TEXT} srgb calc(1 - r) calc(1 - g) calc(1 - b))`,
    [TINT_SCALE_VAR]: '2',
    [MUTE_RATIO_VAR]: '100%'
  }

const COLORS = {} as Record<Color.Fill | Color.Theme, string>,
  MAIN_COLORS = {} as Record<Color.Main, Record<Color.Role, string>>

/** @remarks `light` fades like a border, as a thin border reads weaker on a light page. */
const fadeText = (colors: [string, string]): string =>
  `light-dark(${[1, 0.6].map(ratio => colorMix({ colors, ratio: fadeRatio(ratio) })).join(', ')})`

/** @remarks Mixes a text color into the fill and fades it out when disabled. */
const fadeBorder = ({
  text,
  ratio,
  isUnmutedOnFill
}: {
  text: string
  ratio: number
  isUnmutedOnFill: boolean
}): string =>
  colorMix({
    colors: [mixTowardFill({ text, fill: FILL, ratio, isUnmutedOnFill }), FILL],
    ratio: fadeRatio()
  })

for (const token of COLOR_TOKENS)
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
      COLORS[token] = fadeText([TEXT, FILL])
      COLORS[`${token}-muted`] = fadeText([
        mixTowardFill({ text: TEXT, fill: FILL, ratio: RATIOS.muted, isUnmutedOnFill: true }),
        FILL
      ])
      break

    case 'link':
      COLORS[token] = fadeText([
        cssVar(LINK_VAR, clampLightness(toColor('primary'), LIGHTNESS_CLAMP.text)),
        FILL
      ])
      break

    case 'border':
    case 'divider':
      COLORS[token] = fadeBorder({
        text: TEXT,
        ratio: RATIOS[token],
        isUnmutedOnFill: token === 'border'
      })
      break

    case 'shadow': {
      const alphas: readonly [number, number] = [0.2, 0.8]
      COLORS[token] = colorMix({
        colors: [
          `light-dark(${BG_BASE.map((bg, i) => `oklch(from ${bg} calc(l * 0.2) c h / ${alphas[i]})`).join(', ')})`
        ],
        ratio: fadeRatio()
      })
      break
    }

    default: {
      const mainText: string = clampLightness(toColor(token), LIGHTNESS_CLAMP.text)

      COLORS[token] = colorMix({ colors: [toColor(token)], ratio: fadeRatio() })
      MAIN_COLORS[token] = {
        text: fadeText([mainText, FILL]),
        border: fadeBorder({ text: mainText, ratio: MAIN_RATIOS.border, isUnmutedOnFill: true })
      }
    }
  }

/** @remarks Pairs a main color with text or border, as only those have a checked contrast. */
export const color: {
  (token: Color.Theme | 'focus'): string
  (role: Color.Role, main: Color.Main): string
} = (token: Color.Theme | 'focus', main?: Color.Main): string => {
  if (main) return MAIN_COLORS[main][token as Color.Role]

  if (token === 'focus')
    return toVar({
      name: 'color',
      token,
      value: clampLightness(toColor('primary'), LIGHTNESS_CLAMP.graphic)
    })

  return COLORS[token]
}

/** @remarks Paints a color token or a gradient() and keeps the text, links and hover states readable. */
export const fill = (paint: Color.Fill | Color.Gradient): string => {
  const isGradient = (paint: Color.Fill | Color.Gradient): paint is Color.Gradient =>
      typeof paint !== 'string',
    variables: string[] = [
      `${FILL_VAR}: ${
        isGradient(paint)
          ? TEXTS[convertStr(`on-${paint.text}`, 'camel') as keyof typeof TEXTS]
          : COLORS[paint]
      };`,
      /** @remarks Preserves the default hover for bg fills, as inverted colors are hard to see. */
      Object.keys(FILL_VARS)
        .map(
          name =>
            `${name}: ${
              !isGradient(paint) && BG_FILLS.has(paint as Color.BgFill)
                ? 'initial'
                : FILL_VARS[name]
            };`
        )
        .join(' ')
    ],
    styles: string[] = [`color: ${color('text')};`]

  if (isGradient(paint)) {
    const { image, text }: Color.Gradient = paint

    variables.push(`${TINT_BASE_VAR}: ${BLENDS[text].color};`)
    styles.push(
      `background-image: ${image}; background-blend-mode: ${BLENDS[text].mode};`,

      /** @remarks Omits the blend color to prevent hiding the page. */
      `&:is(${DISABLED_SELECTOR}) { ${TINT_BASE_VAR}: transparent; }`
    )
  } else variables.push(`${TINT_BASE_VAR}: ${cssVar(FILL_VAR)};`)

  styles.push(
    `${CSS_LAYER} { ${DESCENDANTS_SELECTOR} { ${TINT_BASE_VAR}: transparent; } }`,

    /** @remarks Sets the base background for hover tints. */
    `background-color: ${cssVar(TINT_BASE_VAR)};`
  )

  return [...variables, ...styles].join(' ')
}
