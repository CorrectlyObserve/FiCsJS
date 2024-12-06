import FiCsElement from '../core/class'
import { sanitize, throwWindowError } from '../core/helpers'
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

        for (const { path, content, redirect } of pages) {
          const langParam: string = `/${lang}${path}`

          if (
            pathname === path ||
            getRegExp(path).test(pathname) ||
            (lang !== '' && (pathname === langParam || getRegExp(path).test(langParam)))
          )
            return resolveContent({ content, redirect })
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
