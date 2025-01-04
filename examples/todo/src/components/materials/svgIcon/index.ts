import { fics } from 'ficsjs'
import { calc, scale, variable } from 'ficsjs/css'
import css from './style.css?inline'

export const svgIcon = fics<{ icon: string }, { color?: string; click: () => void }>({
  name: 'svg-icon',
  html: ({ data: { icon }, template }) => template`<button class="${icon}"><span /></button>`,
  css: [
    css,
    {
      selector: 'button',
      style: { background: 'none', padding: variable('ex-sm') },
      nested: [
        { selector: '&:focus', style: { transform: scale(0.8) } },
        {
          selector: '&.loading',
          style: { display: 'block', marginInline: 'auto' },
          nested: {
            selector: 'span',
            style: {
              width: calc([variable('ex-lg'), 2], '*'),
              height: calc([variable('ex-lg'), 2], '*'),
              animation: 'loading 1.5s infinite linear'
            }
          }
        },
        {
          selector: 'span',
          style: ({ data: { icon }, props: { color } }) => ({
            width: calc([variable('lg'), 1.5], '*'),
            height: calc([variable('lg'), 1.5], '*'),
            display: 'block',
            maskImage: `url("/icons/${icon}.svg")`,
            background: color ?? '#fff'
          })
        }
      ]
    }
  ],
  actions: {
    button: {
      click: [
        ({ props: { click } }) => {
          if (click) click()
        },
        { throttle: 500, blur: true }
      ]
    }
  }
})

export const loadingIcon = svgIcon.extend({ icon: 'loading' })
