import FiCsElement from '../core/class'
import type { Sanitized } from '../core/types'
import type { FiCsLink, FiCsRouter, LinkData, PageContent, RouterData } from './types'

export const Link = ({
  href,
  anchor,
  router,
  reflections,
  inheritances,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink) =>
  new FiCsElement<LinkData, {}>({
    name: 'link',
    isExceptional: true,
    data: () => ({ anchor }),
    reflections,
    inheritances,
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $data, $template }) => $template`<a href="${href}">${$data.anchor({ $template })}</a>`,
    css,
    actions: [
      ...(actions ?? []),
      {
        handler: 'click',
        selector: 'a',
        method: ({ $event }) => {
          $event.preventDefault()
          window.history.pushState({}, '', href)
          router.setData('pathname', href)
        }
      }
    ],
    hooks
  })

export const Router = ({
  pages,
  notFound,
  reflections,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsRouter) =>
  new FiCsElement<RouterData, {}>({
    name: 'router',
    isExceptional: true,
    data: () => ({ pathname: '' }),
    reflections: { ...reflections, pathname: () => {} },
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $data: { pathname }, $template }) => {
      const setContent = (): Sanitized<RouterData, {}> => {
        const resolveContent = ({ content, redirect }: PageContent): Sanitized<RouterData, {}> => {
          if (redirect) {
            pathname = redirect({})
            window.history.replaceState({}, '', pathname)
            return setContent()
          }

          return typeof content === 'string' || content instanceof FiCsElement
            ? $template`${content}`
            : content
        }

        for (const { path, content, redirect } of pages({ $template }))
          if (pathname === path) return resolveContent({ content, redirect })

        if (notFound) return resolveContent(notFound({ $template }))

        throw new Error(`The ${pathname} does not exist on the pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      ...(hooks ?? {}),
      connect: ({ $setData }) => {
        $setData('pathname', window.location.pathname)
        window.addEventListener('popstate', () => {
          $setData('pathname', window.location.pathname)
        })
      }
    }
  })
