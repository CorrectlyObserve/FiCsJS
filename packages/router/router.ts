import FiCsElement from '../core/class'
import { throwWindowError } from '../core/errors'
import { convertToArray, sanitize } from '../core/helpers'
import type { DataParams, Sanitized } from '../core/types'
import { getRegExp } from './dynamicParam'
import goto from './goto'
import type { FiCsRouter, PageContent } from './types'

export default <D extends object>({
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
}: FiCsRouter<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'router',
    isExceptional: true,
    data: () => {
      if (data && 'pathname' in data())
        throw new Error('"pathname" is a reserved word in FiCsRouter...')
      return { ...(data?.() ?? {}), pathname: '' } as D
    },
    props,
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

          return sanitize(content({ $template, $html, $show }), $template)
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
      created: (dataParams: DataParams<D, {}>) => {
        throwWindowError()

        dataParams.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        hooks?.created?.(dataParams)
      },
      mounted: (dataParams: DataParams<D, {}>) => {
        throwWindowError()

        window.addEventListener('popstate', () =>
          dataParams.$setData('pathname' as keyof D, window.location.pathname as D[keyof D])
        )
        hooks?.mounted?.(dataParams)
      },
      updated: hooks?.updated,
      destroyed: (dataParams: DataParams<D, {}>) => hooks?.destroyed?.(dataParams),
      adopted: (dataParams: DataParams<D, {}>) => hooks?.adopted?.(dataParams)
    },
    options: { ...(options ?? {}), immutable: false }
  })
