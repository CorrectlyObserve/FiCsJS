import FiCsElement from '../core/class'
import type { Sanitize, Sanitized } from '../core/types'
import type {
  FiCsLink,
  FiCsRouter,
  LinkData,
  PageContent,
  RouterContent,
  RouterData
} from './types'

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
      const setPageContent = (): Sanitized<RouterData, {}> => {
        const resolveContent = ({ content, redirect }: PageContent): Sanitized<RouterData, {}> => {
          if (redirect) {
            pathname = redirect({})
            window.history.replaceState({}, '', pathname)
            return setPageContent()
          }

          return setContent(content, $template)
        }

        for (const { path, content, redirect } of pages({ $template }))
          if (pathname === path) return resolveContent({ content, redirect })

        if (notFound) return resolveContent(notFound({ $template }))

        throw new Error(`The ${pathname} does not exist on the pages...`)
      }

      return setPageContent()
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
