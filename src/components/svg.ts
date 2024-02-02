import fics from '../packages/core/fics'

export const Svg = () =>
  fics({
    name: 'svg',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    props: {} as {
      path: string
      color: string
      click: () => void
    },
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
