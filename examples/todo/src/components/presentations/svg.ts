import { fics } from 'ficsjs'

interface Props {
  size?: string
  color?: string
  padding?: string
  click: () => void
}

export default (name: string) =>
  fics<{}, Props>({
    name,
    html: ({ $template }) => $template`<button><div /></button>`,
    css: {
      selector: 'button',
      style: ({ $props: { padding } }) => ({ background: 'none', padding: padding ?? 0 }),
      nested: {
        selector: 'div',
        style: ({ $props: { size, color } }) => ({
          width: size ?? 'calc(var(--lg) * 1.5)',
          height: size ?? 'calc(var(--lg) * 1.5)',
          maskImage: `url("/icons/${name}.svg")`,
          background: color ?? '#fff'
        })
      }
    },
    actions: [
      {
        handler: 'click',
        method: ({ $props: { click } }) => click(),
        options: { throttle: 500, blur: true }
      }
    ]
  })
