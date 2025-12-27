import { fics } from 'ficsjs'
import { white } from '@/utils'

export default () =>
  fics<
    {},
    { svg: string; areaLabel: string; isLarge?: string; isPressed?: boolean; click: () => void }
  >({
    name: 'icon',
    className: 'icon',
    html: ({ props: { svg, areaLabel, isLarge, isPressed }, template, html }) => template`
      <button
        class="clickable flex text-white ${isLarge ? 'p-4' : 'p-3'} rounded-lg"
        aria-label="${areaLabel}"
        ${isPressed === undefined ? '' : `aria-pressed="${isPressed ? 'true' : 'false'}"`}
        type="button"
      >${html(svg)}</button>
    `,
    css: {
      button: ({ props: { isLarge } }) => ({
        '&:hover': { background: white(0.1) },
        svg: { width: `${isLarge ? 2.5 : 1.25}rem`, height: 'auto', stroke: 'currentColor' }
      })
    },
    actions: {
      button: { click: [({ props: { click } }) => click(), { throttle: 500, blur: true }] }
    }
  })
