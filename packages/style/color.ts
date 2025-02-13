import { throwWindowError } from './../core/helpers'

type Rgb = Record<'red' | 'green' | 'blue', number>

export default ({
  hex,
  rate,
  isOpacity = true
}: {
  hex: string
  rate: number
  isOpacity?: boolean
}): string => {
  if (hex.startsWith('--')) {
    throwWindowError()
    hex = window.getComputedStyle(document.documentElement).getPropertyValue(hex).trim()
  }

  if (hex === '') return ''

  if (!hex.startsWith('#'))
    throw new Error(`The "${hex}" must start with "#" and follow a valid format...`)

  if (isNaN(rate) || rate <= -1 || rate >= 1)
    throw new Error(`The "${rate}" must be between -1 and 1 (exclusive)...`)

  const rgbKeys = ['red', 'green', 'blue'] as const
  let _hex: string = hex.slice(1)

  if (_hex.length === 3) {
    const [r, g, b]: string[] = _hex.split('')
    _hex = `${r}${r}${g}${g}${b}${b}`
  }

  const rgb: Rgb = rgbKeys.reduce(
    (prev, curr, i) => ({ ...prev, [curr]: parseInt(_hex.slice(i * 2, i * 2 + 2), 16) }),
    {} as Rgb
  )

  if (isOpacity) return `rgba(${Object.values(rgb).join()}, ${Math.max(0, rate)})`

  const { red, green, blue }: Rgb = rgb
  const maxColorValue: number = 255
  const r: number = red / maxColorValue
  const g: number = green / maxColorValue
  const b: number = blue / maxColorValue

  const max: number = Math.max(r, g, b)
  const min: number = Math.min(r, g, b)
  const diff: number = max - min
  const sectorAngle: number = 60
  let h: number = 0

  if (min !== max) {
    const hueCorrections: Record<number, number[]> = {
      [r]: [b - g, 180],
      [g]: [r - b, 300],
      [b]: [g - r, 60]
    }
    const [hue, correction]: number[] = hueCorrections[min]
    const colorWheelDegree: number = 360
    h = (sectorAngle * (hue / diff) + correction + colorWheelDegree) % colorWheelDegree
  }

  const s: number = max === 0 ? 0 : diff / max
  const v: number = rate < 0 ? Math.min(1, max + Math.abs(rate)) : Math.max(0, max - max * rate)
  let _rgb: Rgb = rgbKeys.reduce(
    (prev, curr) => ({ ...prev, [curr]: s > 0 ? 0 : Math.round(v * maxColorValue) }),
    {} as Rgb
  )

  if (s > 0) {
    const integer: number = Math.floor(h / sectorAngle)
    const decimal: number = h / sectorAngle - integer
    const values: number[] = [v * (1 - s), v * (1 - s * decimal), v * (1 - s * (1 - decimal))]
    const rgbs: number[][] = [
      [v, values[2], values[0]],
      [values[1], v, values[0]],
      [values[0], v, values[2]],
      [values[0], values[1], v],
      [values[2], values[0], v],
      [v, values[0], values[1]]
    ]

    _rgb = rgbs[integer % rgbs.length].reduce(
      (prev, curr, i) => ({ ...prev, [rgbKeys[i]]: Math.round(curr * maxColorValue) }),
      rgb
    )
  }

  return rgbKeys.reduce((prev, curr) => {
    const value: string = _rgb[curr].toString(16).toUpperCase()
    return prev + (value.length === 1 ? `0${value}` : value)
  }, '#')
}
