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
    html: ({ html }) => html`<button />`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: ({ size, dir }, { path, color }) => ({
          width: size,
          height: size,
          maskImage: `url("${dir}/${path}.svg")`,
          background: color,
          border: 'none',
          cursor: 'pointer'
        })
      }
    ],
    actions: [{ handler: 'click', method: (_, { click }) => click() }]
  })

export type SvgType = ReturnType<typeof Svg>
