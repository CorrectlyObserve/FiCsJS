import { fics, html } from '../packages/core/fics'

export const Svg = (path: string, color: string) =>
  fics({
    name: 'svg',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    html: html`<button />`,
    css: [
      { selector: ':host', style: () => ({ display: 'flex' }) },
      {
        selector: 'button',
        style: ({ data: { size, dir } }) => ({
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
        method: ({ props: { click } }: { props: { click: () => void } }) => click()
      }
    ]
  })

export type SvgType = ReturnType<typeof Svg>
