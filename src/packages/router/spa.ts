import FiCsElement from '../core/class'
import type { Sanitize, Sanitized } from '../core/types'
import type { FiCsLink, FiCsRouter, LinkData, RouterContent, RouterData } from './types'

const setContent = <D extends LinkData | RouterData>(
  content: RouterContent<D>,
  sanitize: Sanitize<D, {}>
): Sanitized<D, {}> =>
  typeof content === 'string' || content instanceof FiCsElement ? sanitize`${content}` : content

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
    html: ({ $data, $template }) =>
      setContent($template`<a href="${href}">${$data.anchor({ $template })}</a>`, $template),
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
  reflections,
  inheritances,
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
    reflections,
    inheritances,
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $data: { pathname }, $template }) => {
      for (const { path, content } of pages({ $template }))
        if (path === pathname || path === '404') return setContent(content, $template)

      throw new Error(`The ${pathname} does not exist on the pages...`)
    },
    css,
    actions,
    hooks: {
      ...(hooks ?? {}),
      connect: ({ $setData }) => {
        const { pathname }: { pathname: string } = window.location
        $setData('pathname', pathname)
        window.addEventListener('popstate', () => $setData('pathname', pathname))
      }
    }
  })
