import { a11yAttrs } from '../core/a11y'
import { FiCsElement } from '../core/class'
import { CSS_LAYER, escape, HOST_SELECTOR, isBlankString, typedEntries } from '../core/helpers'
import type { FiCs } from '../core/namespaces'
import { LINK_COMPONENT_NAME } from './constants'
import { goto } from './goto'
import type { FiCsLink, Returned } from './types'

export const ficsLink = <P extends object>({
  name = LINK_COMPONENT_NAME,
  children,
  href,
  props,
  className,
  attributes,
  anchorAttributes,
  content,
  css: _css,
  actions: _actions
}: FiCsLink<P>): FiCsElement<{}, P> => {
  const html: FiCs.Html<{}, P> = ({ data, props, deferredStates, template, ...args }) => {
      const resolvedHref: unknown = typeof href === 'function' ? href({ props }) : href

      if (typeof resolvedHref !== 'string' || isBlankString(resolvedHref))
        throw new Error('The "href" must be a non-empty string...')

      let anchorAttrsStr: string = ''

      if (anchorAttributes !== undefined) {
        const entries = typedEntries(
            typeof anchorAttributes === 'function'
              ? anchorAttributes({ data, props, deferredStates, a11y: a11yAttrs })
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

        anchorAttrsStr = attrs.join(' ')
      }

      const _content: Returned<{}, P> = content({ data, props, deferredStates, template, ...args })
      return template`
        <a ${[`href="${resolvedHref.trim()}"`, anchorAttrsStr].filter(Boolean).join(' ')}>
          ${template`${_content instanceof FiCsElement ? template`${_content}` : _content}`}
        </a>
      `
    },
    css: FiCs.Css<{}, P> = [
      `
        ${CSS_LAYER} {
          ${HOST_SELECTOR} {
            width: 100%;

            a {
              display: block;
              text-decoration: none;
              line-height: inherit;

              &:visited { color: inherit; }
            }
          }
        }
      `,
      ...(_css ? (Array.isArray(_css) ? _css : [_css]) : [])
    ],
    actions: FiCs.Actions<{}, P> = {
      [`${HOST_SELECTOR} > a[href]`]: {
        click: [
          ({ event, attributes: { href, download, target } }) => {
            href = href.trim()
            if (
              isBlankString(href) ||
              download !== undefined ||
              (target !== undefined && target !== '_self')
            )
              return

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
      }
    }

  return new FiCsElement<{}, P>({
    name,
    children,
    props,
    className,
    attributes,
    html,
    css,
    actions: { ...actions, ..._actions }
  })
}
