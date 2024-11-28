import FiCsElement from '../core/class'
import { convertToArray, sanitize, throwWindowError } from '../core/helpers'
import type { Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
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
    data: () => ({ pathname: '' }),
    props,
    html: ({ $data: { pathname }, $props, $template, $html, $show }) => {
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

          return sanitize(content({ $props, $template, $html, $show }), $template)
        }

        for (const { path, content, redirect } of pages)
          for (const _path of convertToArray(path))
            if (pathname === _path || getRegExp(_path).test(pathname!))
              return resolveContent({ content, redirect })

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
      }
    },
    options
  })
