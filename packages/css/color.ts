type RgbKey = 'red' | 'green' | 'blue'
type Rgb = Record<RgbKey, number>

export default (
  hex: string,
  rate: number,
  direction: 'darken' | 'lighten' | 'translucent' = 'translucent'
): string => {
  if (!hex.startsWith('#'))
    throw new Error(`${hex} must start with "#" and follow a valid format...`)

  if (isNaN(rate) || rate <= 0 || rate >= 1)
    throw new Error(`${rate} must be between 0 and 1 (exclusive).`)

  const _hex: string = hex.slice(1)
  const rgbKeys: RgbKey[] = ['red', 'green', 'blue']
  const rgb: Rgb = rgbKeys.reduce(
    (prev, curr, i) => ({ ...prev, [curr]: parseInt(_hex.slice(i * 2, i * 2 + 2), 16) }),
    {} as Rgb
  )

  if (direction === 'translucent') return `rgba(${Object.values(rgb).join()}, ${rate})`

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
  const v: number = max * (1 + rate * (direction === 'darken' ? -1 : 1))
  let _rgb: Rgb = rgbKeys.reduce(
    (prev, curr) => ({ ...prev, [curr]: s > 0 ? 0 : v * maxColorValue }),
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
