import FiCsElement from '../core/class'
import type { Params, Sanitized } from '../core/types'
import throwWindowError from '../core/utils'
import { getRegExp } from './dynamicParam'
import type { FiCsRouter, FiCsRouterElement, PageContent, RouterContent, RouterData } from './types'

export default ({
  pages,
  notFound,
  inheritances,
  isOnlyCsr,
  className,
  attributes,
  css,
  actions,
  hooks
}: FiCsRouter): FiCsRouterElement =>
  new FiCsElement<RouterData, {}>({
    name: 'router',
    isExceptional: true,
    data: () => ({ pathname: '' }),
    inheritances,
    isOnlyCsr,
    className,
    attributes,
    html: ({ $data: { pathname }, $template, $html, $show }) => {
      const setContent = (): Sanitized<RouterData, {}> => {
        const resolveContent = ({ content, redirect }: PageContent): Sanitized<RouterData, {}> => {
          if (redirect) {
            pathname = redirect
            window.history.replaceState({}, '', pathname)
            return setContent()
          }

          const returned: RouterContent = content({ $template, $html, $show })
          return returned instanceof FiCsElement ? $template`${returned}` : returned
        }

        for (const { path, content, redirect } of pages)
          for (const _path of Array.isArray(path) ? path : [path])
            if (pathname === _path || getRegExp(_path).test(pathname))
              return resolveContent({ content, redirect })

        if (notFound) return resolveContent(notFound)

        throw new Error(`The "${pathname}" does not exist on the pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      created: (params: Params<RouterData, {}>) => {
        throwWindowError()

        params.$setData('pathname', window.location.pathname)
        hooks?.created?.(params)
      },
      mounted: (params: Params<RouterData, {}>) => {
        throwWindowError()

        window.addEventListener('popstate', () =>
          params.$setData('pathname', window.location.pathname)
        )
        hooks?.mounted?.(params)
      },
      updated: hooks?.updated,
      destroyed: (params: Params<RouterData, {}>) => hooks?.destroyed?.(params),
      adopted: (params: Params<RouterData, {}>) => hooks?.adopted?.(params)
    }
  })
