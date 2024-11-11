import FiCsElement from '../core/class'
import { convertToArray, sanitize, throwWindowError } from '../core/helpers'
import type { DataParams, Poll, Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import goto from './goto'
import type { FiCsRouter, PageContent } from './types'

export default <D extends object, P extends object>({
  pages,
  notFound,
  data,
  props,
  className,
  attributes,
  css,
  actions,
  hooks,
  options
}: FiCsRouter<D, P>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name: 'router',
    isExceptional: true,
    data: () => {
      if (data && 'pathname' in data())
        throw new Error('"pathname" is a reserved word in f-router component...')
      return { ...(data?.() ?? {}), pathname: '' } as D
    },
    props,
    className,
    attributes,
    html: ({ $data, $props, $template, $html, $show }) => {
      let { pathname }: { pathname: string } = $data as { pathname: string }
      const setContent = (): Sanitized<D, P> => {
        const resolveContent = ({ content, redirect }: PageContent<D, P>): Sanitized<D, P> => {
          if (redirect && 'pathname' in $data) {
            pathname = redirect
            goto(pathname, { history: false, reload: false })
            return setContent()
          }

          return sanitize(content({ $props, $template, $html, $show }), $template)
        }

        for (const { paths, content, redirect } of pages)
          for (const path of convertToArray(paths))
            if (pathname === path || getRegExp(path).test(pathname!))
              return resolveContent({ content, redirect })

        if (notFound) return resolveContent(notFound)

        throw new Error(`The "${pathname}" does not exist on pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      created: (params: DataParams<D, P>) => {
        throwWindowError()

        params.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        hooks?.created?.(params)
      },
      mounted: (params: DataParams<D, P> & Poll) => {
        throwWindowError()

        window.addEventListener('popstate', () =>
          params.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        )
        hooks?.mounted?.(params)
      },
      updated: hooks?.updated,
      destroyed: (params: DataParams<D, P>) => hooks?.destroyed?.(params),
      adopted: (params: DataParams<D, P>) => hooks?.adopted?.(params)
    },
    options
  })
