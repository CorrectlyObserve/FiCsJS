import FiCsElement from '../core/class'
import { sanitize, throwWindowError } from '../core/helpers'
import type { Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import getPathParams from './getPathParams'
import getQueryParams from './getQueryParams'
import goto from './goto'
import type { FiCsRouter, PageContent, RouterData } from './types'

export default <P extends object>({
  pages,
  notFound,
  props,
  options
}: FiCsRouter<P>): FiCsElement<RouterData, P> =>
  new FiCsElement<RouterData, P>({
    name: 'router',
    isExceptional: true,
    data: () => ({ pathname: '', lang: '', pathParams: {}, queryParams: {} }),
    props,
    html: ({ $data: { pathname, lang }, $template, $setData, ...args }) => {
      const setContent = (): Sanitized<RouterData, P> => {
        const resolveContent = ({
          content,
          redirect
        }: PageContent<P>): Sanitized<RouterData, P> => {
          if (redirect) {
            pathname = redirect
            goto(pathname, { history: false, reload: false })
            return setContent()
          }

          return sanitize(content({ ...args, $template }), $template)
        }

        for (const { path, content, redirect } of pages) {
          const isMatched = (path: string): boolean =>
            pathname === path || getRegExp(path).test(pathname)
          const langPath: string = `/${lang}${path}`

          if (isMatched(path) || (lang !== '' && isMatched(langPath))) {
            $setData(
              'pathParams',
              getPathParams(Object.keys(getPathParams(path)).length > 0 ? path : langPath)
            )

            return resolveContent({ content, redirect })
          }
        }

        if (notFound) return resolveContent(notFound)

        throw new Error(`The "${pathname}" does not exist on pages...`)
      }

      return setContent()
    },
    hooks: {
      created: ({ $setData }) => {
        throwWindowError()
        $setData('pathname', window.location.pathname)
      },
      mounted: ({ $setData }) => {
        throwWindowError()
        window.addEventListener('popstate', () => $setData('pathname', window.location.pathname))
        $setData('queryParams', getQueryParams())
      }
    },
    options
  })
