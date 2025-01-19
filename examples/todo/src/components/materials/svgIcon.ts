import { fics } from 'ficsjs'
import { calc, rotate, scale, variable } from 'ficsjs/style'

export const svgIcon = fics<{ icon: string }, { color?: string; click: () => void }>({
  name: 'svg-icon',
  html: ({ data: { icon }, template }) => template`<button class="${icon}"><span /></button>`,
  css: {
    button: ({ data: { icon }, props: { color } }) => ({
      background: 'none',
      padding: variable('xs'),
      '&:focus': { transform: scale(0.8) },
      '&.loading': {
        display: 'block',
        marginInline: 'auto',
        span: {
          width: variable('4xl'),
          height: variable('4xl'),
          animation: 'loading 1.5s infinite linear'
        }
      },
      span: {
        width: calc([variable('lg'), 1.5], '*'),
        height: calc([variable('lg'), 1.5], '*'),
        display: 'block',
        maskImage: `url("/icons/${icon}.svg")`,
        background: color ?? '#fff'
      },
      '@keyframes loading': { from: { transform: rotate(0) }, to: { transform: rotate(360) } }
    })
  },
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
