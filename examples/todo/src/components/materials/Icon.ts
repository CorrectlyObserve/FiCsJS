import { fics } from 'ficsjs'
import { spin } from 'ficsjs/animation'
import { cssVar } from 'ficsjs/style'
import { white } from '@/utils'

interface Props {
  svg: string
  areaLabel: string
  color?: string
  isLoadingIcon?: boolean
  click?: () => void
}

const svgStyle = (width: string) =>
  ({ width: cssVar(width), height: 'auto', stroke: 'currentColor' }) as const

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
        svg: svgStyle('xl'),
        ...(isLoadingIcon
          ? { display: 'block', marginInline: 'auto', svg: { ...svgStyle('2xl'), ...spin(1.5) } }
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
