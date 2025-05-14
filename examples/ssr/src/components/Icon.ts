import { fics } from 'ficsjs'

export default () =>
  fics<{}, { icon: string; isLarge?: string }>({
    name: 'icon',
    html: ({ props: { icon, isLarge }, template, html }) => template`
      <span class="flex ${isLarge ? 'p-4' : 'p-3'}">${html(icon)}</span>
    `,
    css: {
      span: ({ props: { isLarge } }) => ({
        svg: { width: `${isLarge ? '2.5' : '1.25'}rem`, height: 'auto', stroke: 'currentColor' }
      })
    }
  })
