import FiCsElement from '../core/class'
import type { Descendant, Sanitized } from '../core/types'
import goto from './goto'
import type { FiCsLink } from './types'

export default <D extends { href: string }, P extends object>({
  children,
  href,
  props,
  className,
  attributes,
  content,
  css,
  actions
}: FiCsLink<D, P>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name: 'link',
    isExceptional: true,
    children,
    data: () => ({ href }) as D,
    props,
    className,
    attributes,
    html: ({ data: { href }, template, ...args }) => {
      const _content: Descendant | Sanitized<D, P> = content({
        data: { href } as D,
        template,
        ...args
      })

      return template`
        <a href="${href}">
          ${template`${_content instanceof FiCsElement ? template`${_content}` : _content}`}
        </a>
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
      '> a[href]': {
        click: ({ data: { href }, event }) => {
          event.preventDefault()
          goto(href)
        }
      },
      ...actions
    }
  })
