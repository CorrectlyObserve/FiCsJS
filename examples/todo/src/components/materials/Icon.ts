import { fics } from 'ficsjs'
import { cssVar, rotate } from 'ficsjs/style'
import { white } from '@/utils'

export default (icon: string) =>
  fics<{ icon: string }, { color?: string; click: () => void }>({
    name: 'icon',
    data: () => ({ icon }),
    html: ({ data: { icon }, template }) => template`<button class="${icon}"><span /></button>`,
    css: {
      button: ({ data: { icon }, props: { color } }) => ({
        background: 'none',
        padding: cssVar('xs'),
        '&:focus': { scale: 0.8 },
        '&.loading': {
          display: 'block',
          marginInline: 'auto',
          span: {
            width: cssVar('2xl'),
            height: cssVar('2xl'),
            animation: 'loading 1.5s infinite linear'
          }
        },
        span: {
          width: cssVar('xl'),
          height: cssVar('xl'),
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
