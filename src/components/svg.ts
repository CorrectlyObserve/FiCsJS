import fics from '../packages/core/fics'

interface Arg {
  size: string
  path: string
  color: string
  click: () => void
}

export const Svg = ({ size, path, color, click }: Arg) =>
  fics({
    name: 'svg',
    isImmutable: true,
    html: ({ $template }) => $template`<button />`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: {
          width: size,
          height: size,
          maskImage: `url("./../../icons/${path}.svg")`,
          background: color,
          border: 'none',
          cursor: 'pointer'
        }
      }
    ],
    actions: [{ handler: 'click', method: click }]
  })

export type SvgType = ReturnType<typeof Svg>
