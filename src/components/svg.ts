import { fics, html } from '../packages/core/fics'

export const Svg = (path: string, color: string) =>
  fics({
    name: 'icon',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    html: html`<div />`,
    css: [
      {
        selector: 'div',
        style: ({ data: { size, dir } }) => ({
          width: size,
          height: size,
          maskImage: `url("${dir}/${path}.svg")`,
          background: color
        })
      }
    ]
  })

export type SvgType = ReturnType<typeof Svg>
