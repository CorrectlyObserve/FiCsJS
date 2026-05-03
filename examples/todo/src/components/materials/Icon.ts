import { fics } from 'ficsjs'
import { rect, size } from 'ficsjs/style'
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
    css: ({ props: { color }, cssToString }) => `
      button[type="button"] {
        background: none;
        color: ${color ?? white()};
        padding: ${size(2)};

        &:hover { background: ${white(0.1)}; }
        &:focus, &:focus-visible { outline-color: ${color ?? white()}; }

        svg {
          ${cssToString(rect(8))}
          display: flex;
          stroke: currentColor;
        }
      }
    `,
    actions: {
      button: { click: [({ props: { click } }) => click?.(), { throttle: 500, blur: true }] }
    }
  })
