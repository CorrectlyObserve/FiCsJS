import { type FiCs } from 'ficsjs'
import { ficsLink } from 'ficsjs/router'
import { color, flex, interactive, radius, space, stroke, tapSize } from 'ficsjs/style'
import { TOOLTIP_ID, tooltipCss, tooltipHandlers, tooltipMarkup } from '@/components/Tooltip'

interface Props {
  href: string
  text: string
  isCurrent?: boolean
  tooltip?: string
}

const css: FiCs.Css<{}, Props> = () => `
  :host {
    width: auto;

    a {
      ${flex({ inline: true, center: 'xy' })}
      ${radius('sm')};
      ${interactive()}
      ${tooltipCss()}
      width: 100%;
      min-height: ${tapSize()};
      color: ${color('text')};
      padding-inline: ${space('md')};
      border: ${stroke('sm')} solid ${color('border')};
      text-decoration: none;

      &[aria-current='page'] { color: ${color('text-muted')}; }
    }
  }
`

export default () =>
  ficsLink<Props>({
    href: ({ props }) => props.href,
    anchorAttributes: ({ props: { isCurrent, tooltip } }) => ({
      ...(isCurrent && { 'aria-current': 'page' }),
      ...(tooltip && { 'aria-describedby': TOOLTIP_ID })
    }),
    content: ({ props: { text, tooltip }, template }) =>
      template`${text}${tooltipMarkup(template, tooltip)}`,
    css,
    actions: { a: tooltipHandlers<{}, Props>() }
  })
