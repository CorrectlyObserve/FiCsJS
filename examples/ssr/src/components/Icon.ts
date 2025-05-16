import { fics } from 'ficsjs'
import { color } from 'ficsjs/style'

export default () =>
  fics<{}, { icon: string; isLarge?: string }>({
    name: 'icon',
    html: ({ props: { icon, isLarge }, template, html }) => template`
      <span class="flex ${isLarge ? 'p-4' : 'p-3'}">${html(icon)}</span>
    `,
    css: {
      span: ({ props: { isLarge } }) => {
        const size = isLarge ? '2.5rem' : '1.25rem'
        return {
          svg: { width: size, height: 'auto', stroke: 'currentColor' },
          span: { width: size, height: size, background: color({ hex: '#fff', rate: 0.1 }) }
        }
      }
    }
  })
