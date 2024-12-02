import { fics } from 'ficsjs'

interface Props {
  icon: string
  size?: string
  color?: string
  padding?: string
  click: () => void
}

export default () =>
  fics<{}, Props>({
    name: 'svg',
    html: ({ $template }) => $template`<button><div /></button>`,
    css: [
      { style: { display: 'flex' } },
      {
        selector: 'button',
        style: ({ $props: { padding } }) => ({
          background: 'none',
          padding: padding ?? 0
        }),
        nested: {
          selector: 'div',
          style: ({ $props: { icon, size, color } }) => ({
            width: size ?? 'calc(var(--lg) * 1.5)',
            height: size ?? 'calc(var(--lg) * 1.5)',
            maskImage: `url("/icons/${icon}.svg")`,
            background: color ?? '#fff'
          })
        }
      }
    ],
    actions: [
      {
        handler: 'click',
        method: ({ $props: { click } }) => click(),
        options: { throttle: 500, blur: true }
      }
    ]
  })
