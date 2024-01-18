import { fics } from '../packages/core/fics'

interface Props {
  path: string
  color: string
  click: () => void
}

export const Svg = () =>
  fics({
    name: 'svg',
    data: () => ({ size: 'var(--lg)', dir: '../icons' }),
    html: ({ html }, props: Props) => html`<button />`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: ({ size, dir }, { path, color }: Props) => ({
          width: size,
          height: size,
          maskImage: `url("${dir}/${path}.svg")`,
          background: color,
          border: 'none',
          cursor: 'pointer'
        })
      }
    ],
    actions: [{ handler: 'click', method: (_, { click }: Props) => click() }]
  })

export type SvgType = ReturnType<typeof Svg>
