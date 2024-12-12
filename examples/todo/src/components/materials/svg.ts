import { fics } from 'ficsjs'

export default fics<{ icon: string }, { color?: string; click: () => void }>({
  name: 'svg',
  html: ({ $template }) => $template`<button><span /></button>`,
  css: {
    selector: 'button',
    style: { background: 'none', padding: 'var(--ex-sm)' },
    nested: {
      selector: 'span',
      style: ({ $data: { icon }, $props: { color } }) => ({
        width: 'calc(var(--lg) * 1.5)',
        height: 'calc(var(--lg) * 1.5)',
        display: 'block',
        maskImage: `url("/icons/${icon}.svg")`,
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
