import { fics } from 'ficsjs'
import { calc, scale, variable } from 'ficsjs/style'

export const svgIcon = fics<{ icon: string }, { color?: string; click: () => void }>({
  name: 'svg-icon',
  html: ({ data: { icon }, template }) => template`<button class="${icon}"><span /></button>`,
  css: {
    button: ({ data: { icon }, props: { color } }) => ({
      background: 'none',
      padding: variable('ex-sm'),
      '&:focus': { transform: scale(0.8) },
      '&.loading': {
        display: 'block',
        marginInline: 'auto',
        span: {
          width: calc([variable('ex-lg'), 2], '*'),
          height: calc([variable('ex-lg'), 2], '*'),
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
      '@keyframes loading': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' }
      }
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
