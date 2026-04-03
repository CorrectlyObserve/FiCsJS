import { fics } from 'ficsjs'
import { cssVar } from 'ficsjs/style'
import { white } from '@/utils/others'

interface Props {
  svg: string
  ariaLabel: string
  isPressed?: boolean
  color?: string
  click?: () => void
}

export default () =>
  fics<{}, Props>({
    name: 'icon',
    html: ({
      props: { ariaLabel, svg, isPressed },
      template,
      unsafeHtml,
      attributes: { boolean }
    }) => template`
      <button
        aria-label="${ariaLabel}"
        ${isPressed === undefined ? '' : `aria-pressed="${boolean(isPressed)}"`}
        type="button"
      >${unsafeHtml(svg)}</button>
    `,
    css: {
      'button[type="button"]': ({ props: { color } }) => ({
        background: 'none',
        color: color ?? white(),
        padding: cssVar('xs'),
        '&:hover': { background: white(0.1) },
        '&:focus, &:focus-visible': { outlineColor: color ?? white() },
        svg: { display: 'flex', width: cssVar('xl'), height: 'auto', stroke: 'currentColor' }
      })
    },
    actions: {
      button: { click: [({ props: { click } }) => click?.(), { throttle: 500, blur: true }] }
    }
  })
