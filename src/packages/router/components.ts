import FiCsElement from '../core/class'
import type { Sanitized } from '../core/types'
import { getRegExp, pathParam } from './pathParam'
import type { FiCsLink, FiCsRouter, LinkData, PageContent, RouterData } from './types'

export const Link = ({
  href,
  content,
  router,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsLink) => {
  if (typeof href === 'function') {
    const $setPathParams = (path: string, params: Record<string, string>): string =>
      path.replace(pathParam, (key: string) => {
        key = key.slice(2)

        if (key in params) return `/${params[key]}`
        else throw new Error(`"${key}" is not defined in params...`)
      })

    href = href($setPathParams)
  }

  return new FiCsElement<LinkData, {}>({
    name: 'link',
    isExceptional: true,
    isImmutable: true,
    isOnlyCsr: true,
    className,
    attributes,
    html: ({ $template, $html, $show, $i18n }) => $template`<a href="${href}">
        ${typeof content === 'function' ? content({ $template, $html, $show, $i18n }) : content}
      </a>`,
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
}

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
        const resolveContent = ({ content, redirect }: PageContent): Sanitized<RouterData, {}> => {
          if (redirect) {
            pathname = redirect
            window.history.replaceState({}, '', pathname)
            return setContent()
          }

          return typeof content === 'string' || content instanceof FiCsElement
            ? $template`${content}`
            : content
        }

        if (typeof pages === 'function') pages = pages({ $template, $html, $show, $i18n })

        for (const { path, content, redirect } of pages)
          if (pathname === path || getRegExp(path).test(pathname))
            return resolveContent({ content, redirect })

        if (notFound)
          return resolveContent(
            typeof notFound === 'function' ? notFound({ $template, $html, $show, $i18n }) : notFound
          )

        throw new Error(`The "${pathname}" does not exist on the pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      ...(hooks ?? {}),
      connect: ({ $setData }) => {
        if (!window) throw new Error('window is not defined...')

        const setPathname = (): void => $setData('pathname', window.location.pathname)

        setPathname()
        window.addEventListener('popstate', setPathname)
      }
    }
  })
