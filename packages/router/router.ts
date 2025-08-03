import FiCsElement from '../core/class'
import { isBlankObject } from '../core/helpers'
import type { Descendant, Sanitized } from '../core/types'
import { dynamicPathParams, dynamicPathToRegExp, hasDynamicPaths } from './dynamicPaths'
import goto from './goto'
import { params, queryParams, searchParams } from './params'
import type { FiCsRouter, PageContent } from './types'

export default <D extends { pathname: string; lang: string }, P extends object>({
  children,
  pathname = '/',
  props,
  className,
  attributes,
  pages,
  notFound,
  css,
  options
}: FiCsRouter<D, P>): FiCsElement<D, P> =>
  new FiCsElement<D, P>({
    name: 'router',
    isExceptional: true,
    children,
    data: () => ({ pathname, lang: '' }) as D,
    props,
    className,
    attributes,
    html: ({ data: { pathname, lang }, template, setData, ...args }) => {
      const setContent = (): Sanitized<D, P> => {
        const resolveContent = (
          { content, redirect }: PageContent<D, P>,
          isWithoutHistory?: boolean
        ): Sanitized<D, P> => {
          if (redirect) {
            setData('pathname', redirect)
            goto(pathname, isWithoutHistory)
            return setContent()
          }

          const _content: Descendant | Sanitized<D, P> = content({
            data: { pathname, lang } as D,
            template,
            setData,
            ...args
          })
          return _content instanceof FiCsElement ? template`${_content}` : _content
        }

        const getLangPath = (path: string): string => `/${lang}${path}`,
          isPathMatched = (path: string): boolean => {
            if (!isBlankObject(queryParams()))
              path += Object.entries(queryParams()).reduce(
                (prev, [key, value], index) => `${prev}${index === 0 ? '' : '&'}${key}=${value}`,
                '?'
              )

            return pathname === path || pathname === getLangPath(path)
          }

        if (isPathMatched('/404') && notFound) return resolveContent(notFound, true)

        const dynamicPages: (PageContent<D, P> & { path: string })[] = []

        for (const { path, content, redirect } of pages) {
          const langPath: string = getLangPath(path)

          if (hasDynamicPaths(path) || hasDynamicPaths(langPath)) {
            dynamicPages.push({ path, content, redirect })
            continue
          }

          if (isPathMatched(path)) return resolveContent({ content, redirect })
        }

        for (const { path, content, redirect } of dynamicPages) {
          const langPath: string = getLangPath(path)

          if (
            dynamicPathToRegExp(path).test(pathname) ||
            dynamicPathToRegExp(langPath).test(pathname)
          ) {
            const keys: string[] = Object.keys(dynamicPathParams(path))
            params.set('dynamicPaths', dynamicPathParams(keys.length > 0 ? path : langPath))

            return resolveContent({ content, redirect })
          }
        }

        if (notFound) return resolveContent(notFound, true)
        throw new Error(`The "${pathname}" does not exist on pages...`)
      }

      return setContent()
    },
    css,
    hooks: {
      created: ({ setData }) => {
        const { pathname, search }: { pathname: string; search: string } = window.location
        params.set('queries', searchParams(search))
        setData('pathname', pathname)
      },
      mounted: ({ setData }) => {
        window.addEventListener('popstate', () => {
          const { pathname, search }: { pathname: string; search: string } = window.location
          params.set('queries', searchParams(search))
          setData('pathname', pathname)
        })
        window.addEventListener('fics:navigate', (event: Event) => {
          params.set('queries', searchParams(window.location.search))

          const { detail } = event as CustomEvent<{ href: string }>
          setData('pathname', detail.href)
        })
      }
    },
    options
  })
