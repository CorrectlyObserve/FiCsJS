import { FiCsElement } from '../core/class'
import { escape, isBlankString, typedEntries } from '../core/helpers'
import { goto } from './goto'
import type { FiCsLink, Returned } from './types'

export const ficsLink = <P extends object>({
  children,
  href,
  props,
  className,
  attributes,
  anchorAttributes,
  content,
  css,
  actions
}: FiCsLink<P>): FiCsElement<{}, P> =>
  new FiCsElement<{}, P>({
    name: '_link',
    children,
    props,
    className,
    attributes,
    html: ({ data, props, template, ...args }) => {
      const _href: string = (typeof href === 'function' ? href({ props }) : href).trim()
      if (isBlankString(_href)) throw new Error('The "href" must be a non-empty string...')

      let anchorAttrs: string = ''

      if (anchorAttributes !== undefined) {
        const entries = typedEntries(
            typeof anchorAttributes === 'function'
              ? anchorAttributes({ data, props })
              : anchorAttributes
          ),
          attrs: string[] = []

        for (const [key, value] of entries) {
          if (key === 'href')
            throw new Error(
              'Pass the "href" option as a top-level option, not inside "anchorAttributes"...'
            )
          attrs.push(`${key}="${escape(String(value))}"`)
        }

        anchorAttrs = attrs.join(' ')
      }

      const _content: Returned<{}, P> = content({ data, props, template, ...args })
      return template`
        <a ${[`href="${_href}"`, anchorAttrs].filter(Boolean).join(' ')}>
          ${template`${_content instanceof FiCsElement ? template`${_content}` : _content}`}
        </a>
      `
    },
    css: [
      `
        :host {
          display: block;
          width: 100%;

          a {
            display: block;
            text-decoration: none;
            line-height: inherit;

            &:visited { color: inherit; }
          }
        }
      `,
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
