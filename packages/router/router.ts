import FiCsElement from '../core/class'
import type { Params, Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import type { FiCsRouter, PageContent, RouterContent, RouterData } from './types'

const Router = ({
  pages,
  notFound,
  isOnlyCsr,
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
    isOnlyCsr,
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

          const returned: RouterContent = content({ $template, $html, $show, $i18n })
          return returned instanceof FiCsElement ? $template`${returned}` : returned
        }

        for (const { paths, content, redirect } of pages)
          for (const path of Array.isArray(paths) ? paths : [paths])
            if (pathname === path || getRegExp(path).test(pathname))
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
        if (!window) throw new Error('window is not defined...')

        params.$setData('pathname', window.location.pathname)
        hooks?.created?.(params)
      },
      mounted: (params: Params<RouterData, {}>) => {
        if (!window) throw new Error('window is not defined...')

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

export default Router
