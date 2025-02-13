import FiCsElement from '../core/class'
import { throwWindowError } from '../core/helpers'
import type { Descendant, Sanitized } from '../core/types'
import goto from './goto'
import { getPathParams, getRegExp, isPathParam, params } from './params'
import type { FiCsRouter, PageContent, RouterData } from './types'

export default <D extends RouterData, P extends object>({
  props,
  pages,
  notFound,
  css,
  options
}: FiCsRouter<D, P>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name: 'router',
    isExceptional: true,
    data: () => ({ pathname: '', lang: '' }) as D,
    props,
    html: ({ data: { pathname, lang }, template, setData, ...args }) => {
      const setContent = (): Sanitized<D, P> => {
        const resolveContent = ({ content, redirect }: PageContent<D, P>): Sanitized<D, P> => {
          if (redirect) {
            setData('pathname', redirect)
            goto(pathname, { history: false, reload: false })
            return setContent()
          }

          const _content: Descendant | Sanitized<D, P> = content({ template, ...args })
          return _content instanceof FiCsElement ? template`${_content}` : _content
        }

        const getLangPath = (path: string): string => `/${lang}${path}`
        const isPathMatched = (path: string): boolean =>
          pathname === path || pathname === getLangPath(path)

        if (isPathMatched('/404') && notFound) return resolveContent(notFound)

        const dynamicPages: (PageContent<D, P> & { path: string })[] = []

        for (const { path, content, redirect } of pages) {
          const langPath: string = getLangPath(path)

          if (isPathParam(path) || isPathParam(langPath)) {
            dynamicPages.push({ path, content, redirect })
            continue
          }

          if (isPathMatched(path)) return resolveContent({ content, redirect })
        }

        for (const { path, content, redirect } of dynamicPages) {
          const langPath: string = getLangPath(path)

          if (getRegExp(path).test(pathname) || getRegExp(langPath).test(pathname)) {
            params.set(
              'path',
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
    css,
    hooks: {
      created: ({ setData }) => {
        throwWindowError()
        const { pathname, search }: { pathname: string; search: string } = window.location

        setData('pathname', pathname)
        params.set('query', Object.fromEntries(new URLSearchParams(search)))
      },
      mounted: ({ setData }) =>
        window.addEventListener('popstate', () => setData('pathname', window.location.pathname))
    },
    options
  })
