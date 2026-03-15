import FiCsElement from '../core/class'
import { isBlankString } from '../core/helpers'
import goto from './goto'
import type { FiCsLink, Returned } from './types'

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
    html: ({ props, template, ...args }) => {
      const _href: string = (typeof href === 'function' ? href({ props }) : href).trim()
      if (isBlankString(_href)) throw new Error('The "href" must be a non-empty string...')

      const _content: Returned<{}, P> = content({ props, template, ...args })
      return template`
        <a href="${_href}">
          ${template`${_content instanceof FiCsElement ? template`${_content}` : _content}`}
        </a>
      `
    },
    css: [
      {
        ':host': {
          display: 'block',
          width: '100%',
          a: {
            display: 'block',
            textDecoration: 'none',
            lineHeight: 'inherit',
            '&:visited': { color: 'inherit' }
          }
        }
      },
      ...(css ? (Array.isArray(css) ? css : [css]) : [])
    ],
    actions: {
      ':host > a[href]': {
        click: [
          ({ event, attributes: { href } }) => {
            href = href.trim()
            if (isBlankString(href)) return

            const { defaultPrevented, button, metaKey, ctrlKey, shiftKey, altKey }: MouseEvent =
              event as MouseEvent

            if (defaultPrevented || button !== 0 || metaKey || ctrlKey || shiftKey || altKey) return

            let url: URL
            try {
              url = new URL(href, document.baseURI)
            } catch {
              return
            }

            const { origin, pathname, search, hash }: URL = url
            if (origin !== window.location.origin) return

            event.preventDefault()
            goto(`${pathname}${search}${hash}`)
          },
          { blur: true }
        ]
      },
      ...actions
    }
  })
