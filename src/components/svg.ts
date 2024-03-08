import fics from '../packages/core/fics'

interface Data {
  size: string
  dir: string
}

interface Props {
  path: string
  color: string
  click: () => void
}

export const Svg = () =>
  fics<Data, Props>({
    name: 'svg',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    html: ({ template }) => template`<button />`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: ({ data: { size, dir }, props: { path, color } }) => ({
          width: size,
          height: size,
          maskImage: `url("${dir}/${path}.svg")`,
          background: color,
          border: 'none',
          cursor: 'pointer'
        })
      }
    ],
    actions: [{ handler: 'click', method: ({ props: { click } }) => click() }]
  })

export type SvgType = ReturnType<typeof Svg>
