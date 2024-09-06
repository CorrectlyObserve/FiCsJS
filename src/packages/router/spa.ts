import FiCsElement from '../core/class'
import type { Sanitized } from '../core/types'
import type { FiCsLink, FiCsRouter, LinkData, RouterData, RouterContent } from './types'

export const Link = ({
  href,
  anchor,
  router,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink) =>
  new FiCsElement<LinkData, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $template, $html, $show, $i18n }) =>
      $template`<a href="${href}">${anchor({ $template, $html, $show, $i18n })}</a>`,
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
    reflections,
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $data: { pathname }, $template, $html, $show, $i18n }) => {
      const setContent = (): Sanitized<RouterData, {}> => {
        const resolveContent = (
          isArrowFunc: boolean,
          { content, redirect }: RouterContent<typeof isArrowFunc>
        ): Sanitized<RouterData, {}> => {
          if (redirect) {
            pathname = redirect({})
            window.history.replaceState({}, '', pathname)
            return setContent()
          }

          if (typeof content === 'function') content = content()

          return typeof content === 'string' || content instanceof FiCsElement
            ? $template`${content}`
            : content
        }

        for (const { path, content, redirect } of pages({ $template, $html, $show, $i18n }))
          if (pathname === path) return resolveContent(true, { content, redirect })

        if (notFound) return resolveContent(false, notFound({ $template, $html, $show, $i18n }))

        throw new Error(`The "${pathname}" does not exist on the pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      ...(hooks ?? {}),
      connect: ({ $setData }) => {
        const setPathname = (): void => $setData('pathname', window.location.pathname)

        setPathname()
        window.addEventListener('popstate', setPathname)
      }
    }
  })
