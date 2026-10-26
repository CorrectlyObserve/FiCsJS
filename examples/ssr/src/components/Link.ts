import { ficsLink } from 'ficsjs/router'
import { color, flex, interactive, radius, space, stroke, tapSize } from 'ficsjs/style'

interface Props {
  href: string
  text: string
  isCurrent?: boolean
}

const css = `
  :host {
    width: auto;

    a {
      ${flex({ inline: true, center: 'xy' })}
      ${interactive()}
      width: 100%;
      min-height: ${tapSize()};
      color: ${color('text')};
      padding-inline: ${space('md')};
      border: ${stroke('sm')} solid ${color('border')};
      border-radius: ${radius('sm')};
      text-decoration: none;

      &[aria-current='page'] { opacity: 0.5; }
    }
  }
`

export default () =>
  ficsLink<Props>({
    href: ({ props }) => props.href,
    anchorAttributes: ({ props: { isCurrent } }) => ({
      ...(isCurrent && { 'aria-current': 'page' })
    }),
    content: ({ props: { text }, template }) => template`${text}`,
    css
  })
