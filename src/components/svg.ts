import { fics, html } from '../packages/core/fics'

interface Props {
  path: string
  color: string
  click: () => void
}

export const Svg = () =>
  fics({
    name: 'svg',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    html: html`<button />`,
    css: [
      { style: () => ({ display: 'flex' }) },
      {
        selector: 'button',
        style: ({
          data: { size, dir },
          props: { path, color }
        }: {
          data: { size: string; dir: string }
          props: Props
        }) => ({
          width: size,
          height: size,
          maskImage: `url("${dir}/${path}.svg")`,
          background: color,
          border: 'none',
          cursor: 'pointer'
        })
      }
    ],
    actions: [
      {
        handler: 'click',
        method: ({ props: { click } }: { props: Props }) => click()
      }
    ]
  })

export type SvgType = ReturnType<typeof Svg>
