import { fics } from 'ficsjs'
import { rotate, scale, variable } from 'ficsjs/style'
import { white } from '@/utils'

export default (icon: string) =>
  fics<{ icon: string }, { color?: string; click: () => void }>({
    name: 'icon',
    data: () => ({ icon }),
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
            width: variable('2xl'),
            height: variable('2xl'),
            animation: 'loading 1.5s infinite linear'
          }
        },
        span: {
          width: variable('xl'),
          height: variable('xl'),
          display: 'block',
          maskImage: `url("/icons/${icon}.svg")`,
          background: color ?? white
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
