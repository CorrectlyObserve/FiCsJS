import { fics } from 'ficsjs'
import css from './style.css?inline'

export const svgIcon = fics<{ icon: string }, { color?: string; click: () => void }>({
  name: 'svg-icon',
  html: ({ $data: { icon }, $template }) =>
    $template`<button class="${icon}"><span /></button>`,
  css: [
    css,
    {
      selector: 'button',
      style: { background: 'none', padding: 'var(--ex-sm)' },
      nested: [
        {
          selector: '&.loading',
          style: { display: 'block', marginInline: 'auto' },
          nested: {
            selector: 'span',
            style: {
              width: 'calc(var(--ex-lg) * 2)',
              height: 'calc(var(--ex-lg) * 2)',
              animation: 'loading 1.5s infinite linear'
            }
          }
        },
        {
          selector: 'span',
          style: ({ $data: { icon }, $props: { color } }) => ({
            width: 'calc(var(--lg) * 1.5)',
            height: 'calc(var(--lg) * 1.5)',
            display: 'block',
            maskImage: `url("/icons/${icon}.svg")`,
            background: color ?? '#fff'
          })
        }
      ]
    }
  ],
  actions: [
    {
      handler: 'click',
      method: ({ $props: { click } }) => {
        if (click) click()
      },
      options: { throttle: 500, blur: true }
    }
  ]
})

export const loadingIcon = svgIcon.extend({ icon: 'loading' })
