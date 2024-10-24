import FiCsElement from '../core/class'
import { throwWindowError } from '../core/errors'
import type { Params, Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import goto from './goto'
import type { Content, FiCsRouter, PageContent } from './types'

export default <D extends object>({
  pages,
  notFound,
  data,
  inheritances,
  className,
  attributes,
  css,
  actions,
  hooks,
  options
}: FiCsRouter<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'router',
    isExceptional: true,
    data: () => {
      if (data && 'pathname' in data())
        throw new Error('"pathname" is a reserved word in FiCsRouter...')
      return { ...(data?.() ?? {}), pathname: '' } as D
    },
    inheritances,
    className,
    attributes,
    html: ({ $data, $template, $html, $show }) => {
      let { pathname }: { pathname: string } = $data as { pathname: string }
      const setContent = (): Sanitized<D, {}> => {
        const resolveContent = ({ content, redirect }: PageContent<D>): Sanitized<D, {}> => {
          if (redirect && 'pathname' in $data) {
            pathname = redirect
            goto(pathname, { history: false, reload: false })
            return setContent()
          }

          const returned: Content<D> = content({ $template, $html, $show })
          return returned instanceof FiCsElement ? $template`${returned}` : returned
        }

        for (const { path, content, redirect } of pages)
          for (const _path of Array.isArray(path) ? path : [path])
            if (pathname === _path || getRegExp(_path).test(pathname!))
              return resolveContent({ content, redirect })

        if (notFound) return resolveContent(notFound)

        throw new Error(`The "${pathname}" does not exist on pages...`)
      }

      return setContent()
    },
    css,
    actions,
    hooks: {
      created: (params: Params<D, {}>) => {
        throwWindowError()

        params.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        hooks?.created?.(params)
      },
      mounted: (params: Params<D, {}>) => {
        throwWindowError()

        window.addEventListener('popstate', () =>
          params.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        )
        hooks?.mounted?.(params)
      },
      updated: hooks?.updated,
      destroyed: (params: Params<D, {}>) => hooks?.destroyed?.(params),
      adopted: (params: Params<D, {}>) => hooks?.adopted?.(params)
    },
    options: { ...(options ?? {}), immutable: false }
  })
