import { fics } from 'ficsjs'
import { color } from 'ficsjs/style'

export default () =>
  fics<{}, { svg: string; isLarge?: string }>({
    name: 'icon',
    html: ({ props: { svg, isLarge }, template, html }) => template`
      <span class="flex ${isLarge ? 'p-4' : 'p-3'}">${html(svg)}</span>
    `,
    css: {
      span: ({ props: { isLarge } }) => {
        const size = `${isLarge ? 2.5 : 1.25}rem`
        return {
          svg: { width: size, height: 'auto', stroke: 'currentColor' },
          span: { width: size, height: size, background: color({ hex: '#fff', rate: 0.1 }) }
        }
      }
    }
  })
