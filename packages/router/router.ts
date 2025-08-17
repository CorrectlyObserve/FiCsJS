import FiCsElement from '../core/class'
import type { Descendant, Sanitized } from '../core/types'
import { dynamicPathToRegex, dynamicRegex, getDynamicPaths } from './dynamicPaths'
import goto from './goto'
import { params, searchParams } from './params'
import type { FiCsRouter, Page, PageContent } from './types'

export default <D extends { pathname: string }>({
  children,
  data,
  pathname = '/',
  props,
  className,
  attributes,
  pages,
  notFound,
  css,
  options
}: FiCsRouter<D>): FiCsElement<D, {}> =>
  new FiCsElement<D, {}>({
    name: 'router',
    isExceptional: true,
    children,
    data: () => ({ ...data?.(), pathname }) as D,
    props,
    className,
    attributes,
    html: ({ data, template, setData, ...args }) => {
      const setContent = (): Sanitized<D, {}> => {
        const { pathname } = data,
          staticPages: Page<D>[] = [],
          dynamicPages: Page<D>[] = []

        for (const { path, ...args } of pages)
          dynamicRegex.test(path)
            ? dynamicPages.push({ path, ...args })
            : staticPages.push({ path, ...args })

        const resolveContent = ({ content, redirect }: PageContent<D>): Sanitized<D, {}> => {
          if (redirect) {
            if (pathname !== redirect) {
              setData('pathname', redirect)
              goto(redirect, true)
            }

            const staticPage: Page<D> | undefined = staticPages.find(
              ({ path }) => path === redirect
            )
            if (staticPage) {
              const { content, redirect } = staticPage
              return resolveContent({ content, redirect })
            }

            for (const { path, ...args } of dynamicPages)
              if (dynamicPathToRegex(path).test(redirect)) {
                params.set('dynamicPaths', getDynamicPaths(path))
                return resolveContent({ ...args })
              }

            throw new Error(`The redirect path "${redirect}" does not exist on pages...`)
          }

          if (content) {
            const _content: Descendant | Sanitized<D, {}> = content({
              data,
              template,
              setData,
              ...args
            })

            return _content instanceof FiCsElement ? template`${_content}` : _content
          }

          throw new Error('Either "content" or "redirect" must be specified...')
        }

        if (pathname === '/404' && notFound) return resolveContent(notFound)

        const staticPage: Page<D> | undefined = staticPages.find(({ path }) => pathname === path)
        if (staticPage) {
          const { content, redirect } = staticPage
          return resolveContent({ content, redirect })
        }

        for (const { path, ...args } of dynamicPages)
          if (dynamicPathToRegex(path).test(pathname)) {
            params.set('dynamicPaths', getDynamicPaths(path))
            return resolveContent({ ...args })
          }

        if (notFound) {
          goto('/404', true)
          return resolveContent(notFound)
        }
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
