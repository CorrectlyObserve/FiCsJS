import FiCsElement from '../core/class'
import type { Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import type { FiCsRouter, PageContent, RouterContent, RouterData } from './types'

const Router = ({ pages, notFound, className, attributes, css, actions, hooks }: FiCsRouter) =>
  new FiCsElement<{ pathname: string }, {}>({
    name: 'router',
    isExceptional: true,
    data: () => ({ pathname: '' }),
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

          const returned: RouterContent = content({ $template, $html, $show, $i18n })

          return returned instanceof FiCsElement ? $template`${returned}` : returned
        }

        for (const { path, content, redirect } of pages)
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
      ...(hooks ?? {}),
      mounted: ({ $setData }) => {
        if (!window) throw new Error('window is not defined...')

        const setPathname = (): void => $setData('pathname', window.location.pathname)

        setPathname()
        window.addEventListener('popstate', setPathname)
      }
    }
  })

export default Router
