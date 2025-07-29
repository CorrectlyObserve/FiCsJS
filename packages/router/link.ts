import FiCsElement from '../core/class'
import type { Descendant, Sanitized } from '../core/types'
import goto from './goto'
import type { FiCsLink } from './types'

export default <P extends object>({
  children,
  href,
  props,
  className,
  attributes,
  content,
  css,
  actions
}: FiCsLink<P>): FiCsElement<{}, P> =>
  new FiCsElement<{}, P>({
    name: 'link',
    isExceptional: true,
    children,
    props,
    className,
    attributes,
    html: ({ template, ...args }) => {
      const _content: Descendant | Sanitized<{}, P> = content({ template, ...args })
      return template`
        <a href="${href}">${template`${_content instanceof FiCsElement ? template`${_content}` : _content}`}</a>
      `
    },
    css: [
      {
        ':host': {
          display: 'block',
          width: '100%',
          a: { display: 'block', textDecoration: 'none', '&:visited': { color: 'inherit' } }
        }
      },
      ...(css ? (Array.isArray(css) ? css : [css]) : [])
    ],
    actions: {
      ':host > a[href]': {
        click: ({ event, attributes: { href } }) => {
          event.preventDefault()
          goto(href)
        }
      },
      ...actions
    }
  })
