import { fics } from 'ficsjs'
import { cssVar, rotate } from 'ficsjs/style'
import { white } from '@/utils'

interface Props {
  svg: string
  areaLabel: string
  color?: string
  isLoadingIcon?: boolean
  click?: () => void
}

export default () =>
  fics<{}, Props>({
    name: 'icon',
    html: ({ props: { svg, areaLabel }, template, html }) => template`
      <button aria-label="${areaLabel}">${html(svg)}</button>
    `,
    css: {
      button: ({ props: { color, isLoadingIcon } }) => ({
        background: 'none',
        color: color ?? white,
        padding: cssVar('xs'),
        svg: {
          width: cssVar(isLoadingIcon ? '2xl' : 'xl'),
          height: 'auto',
          stroke: 'currentColor'
        },
        ...(isLoadingIcon
          ? {
              display: 'block',
              marginInline: 'auto',
              svg: { animation: 'loading 1.5s infinite linear' },
              '@keyframes loading': {
                from: { transform: rotate(0) },
                to: { transform: rotate(360) }
              }
            }
          : {})
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
