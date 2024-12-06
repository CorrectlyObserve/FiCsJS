import FiCsElement from '../core/class'
import { convertToArray, sanitize, throwWindowError } from '../core/helpers'
import type { Sanitized } from '../core/types'
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
    data: () => ({ pathname: '', lang: '' }),
    props,
    html: ({ $data: { pathname, lang }, $props, $template, $html, $show }) => {
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
          for (const _path of convertToArray(path)) {
            if (pathname === _path) return resolveContent({ content, redirect })

            if (lang !== '' && pathname === `/${lang}${_path}`)
              return resolveContent({ content, redirect })

            continue
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
      }
    },
    options
  })
