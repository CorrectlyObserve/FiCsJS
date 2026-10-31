import { fics, type FiCs } from 'ficsjs'
import { color, fill, layout, maskIcon, radius, rect, space } from 'ficsjs/style'
import {
  type Placement,
  TOOLTIP_ID,
  tooltipCss,
  tooltipHandlers,
  tooltipMarkup
} from '@/components/Tooltip'

export interface Props {
  svg: string
  ariaLabel: string
  variant?: 'neutral' | 'danger'
  isDisabled?: boolean
  tooltip?: string
  tooltipPlacement?: Placement
  isBottomFixed?: boolean
  click: () => void
}

const html: FiCs.Html<{}, Props> = ({
  props: { ariaLabel, variant = 'neutral', isDisabled, tooltip },
  template,
  isBrowser,
  attributes: { disabled }
}) => template`
  <button
    type="button"
    aria-label="${ariaLabel}"
    data-variant="${variant}"
    ${disabled(!isBrowser || isDisabled)}
    ${tooltip && `aria-describedby="${TOOLTIP_ID}"`}
  >
    <span class="icon"></span>
    ${tooltipMarkup(template, tooltip)}
  </button>
`

const css: FiCs.Css<{}, Props> = ({ props: { svg, tooltipPlacement, isBottomFixed } }) => `
  button {
    ${tooltipCss(tooltipPlacement)}

    ${
      (isBottomFixed &&
        `
      ${fill('bg')};
      ${radius('sm')};
      position: fixed;
      bottom: ${space('xl')};
      right: ${space('lg')};
      z-index: 1;
  
      @container ${layout('compact')} { bottom: ${space('lg')}; right: ${space('md')}; }`) ||
      ''
    }

    &[data-variant='danger'] { color: ${color('danger-text')}; }

    > span.icon { ${rect(8, 8)}; ${maskIcon(svg)}; }
  }
`

const actions: FiCs.Actions<{}, Props> = {
  button: {
    click: [
      ({ props: { isDisabled, click } }) => !isDisabled && click(),
      { throttleMs: 500, blur: true }
    ],
    ...tooltipHandlers<{}, Props>()
  }
}

export default () => fics<{}, Props>({ name: 'icon', html, css, actions })
