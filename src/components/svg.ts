import fics from '../packages/core/fics'

interface Svg {
  size: string
  path: string
  color: string
  click: () => void
}

const Svg = ({ size, path, color, click }: Svg) =>
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

const svg = Svg({
  size: '2rem',
  path: 'add',
  color: 'red',
  click: () => console.log('aaa')
})

export default svg
