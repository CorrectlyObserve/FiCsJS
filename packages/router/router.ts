import { FiCsElement } from '../core/class'
import { normalizePath } from '../core/helpers'
import type { Html } from '../core/types'
import { FICS_NAVIGATE } from './constants'
import { dynamicPathToRegex, dynamicRegex, getDynamicPaths } from './dynamicPaths'
import { goto } from './goto'
import { getQueries, params } from './params'
import type { FiCsRouter, Page, PageContent, Returned, RouterData } from './types'

const setRouterData = <D extends object>(data: RouterData<D>, pathname: string): void => {
  const queries: Record<string, string> = getQueries()

  data.pathname = pathname
  data.queries = queries
  params.set('queries', queries)
}

export const ficsRouter = <D extends object>({
  children,
  data,
  pathname = '/',
  props,
  className,
  attributes,
  pages,
  notFound,
  css,
  hooks,
  options
}: FiCsRouter<D>): FiCsElement<RouterData<D>, {}> => {
  let removeEventListeners: () => void = () => {}

  return new FiCsElement<RouterData<D>, {}>({
    name: 'router',
    isExceptional: true,
    children,
    data: () => ({ ...data?.(), pathname, queries: {} }) as RouterData<D>,
    props,
    className,
    attributes,
    html: ({ data, template, ...args }) => {
      const pathname = normalizePath(data.pathname),
        setContent = (): Html.Sanitized<RouterData<D>, {}> => {
          const staticPages: Page<D>[] = [],
            dynamicPages: Page<D>[] = []

          for (const { path, ..._args } of pages) {
            dynamicRegex.lastIndex = 0

            const _pages: Page<D>[] = dynamicRegex.test(path) ? dynamicPages : staticPages
            _pages.push({ path, ..._args })
          }

          const render = ({
            content,
            redirect
          }: PageContent<D>): Html.Sanitized<RouterData<D>, {}> => {
            if (redirect) {
              const redirectedPath: string = normalizePath(
                  new URL(redirect, window.location.origin).pathname
                ),
                staticPage: Page<D> | undefined = staticPages.find(
                  ({ path }) => normalizePath(path) === redirectedPath
                )

              if (pathname !== redirectedPath) {
                data.pathname = redirectedPath
                goto(redirect, { isWithoutHistory: true })
              }

              if (staticPage) {
                params.set('dynamicPaths', {})

                const { content, redirect }: Page<D> = staticPage
                return render({ content, redirect })
              }

              for (const { path, ..._args } of dynamicPages)
                if (dynamicPathToRegex(path).test(redirectedPath)) {
                  params.set('dynamicPaths', getDynamicPaths(path))
                  return render({ ..._args })
                }

              throw new Error(`The redirect path "${redirect}" does not exist on pages...`)
            }

            if (content) {
              const _content: Returned<RouterData<D>, {}> = content({
                data,
                template,
                ...args
              })

              return _content instanceof FiCsElement ? template`${_content}` : _content
            }

            throw new Error('Either "content" or "redirect" must be specified...')
          }

          if (pathname === '/404' && notFound) {
            params.set('dynamicPaths', {})
            return render(notFound)
          }

          const staticPage: Page<D> | undefined = staticPages.find(
            ({ path }) => pathname === normalizePath(path)
          )
          if (staticPage) {
            params.set('dynamicPaths', {})

            const { content, redirect }: Page<D> = staticPage
            return render({ content, redirect })
          }

          for (const { path, ..._args } of dynamicPages)
            if (dynamicPathToRegex(path).test(pathname)) {
              params.set('dynamicPaths', getDynamicPaths(path))
              return render({ ..._args })
            }

          if (notFound) {
            data.pathname = '/404'
            params.set('dynamicPaths', {})
            goto('/404', { isWithoutHistory: true })
            return render(notFound)
          }
          throw new Error(`The "${pathname}" does not exist on pages...`)
        }

      return setContent()
    },
    css,
    hooks: {
      created: ({ data, ...args }) => {
        hooks?.created?.({ data, ...args })
        setRouterData(data, window.location.pathname)
      },
      mounted: ({ data, ...args }) => {
        hooks?.mounted?.({ data, ...args })

        const onPopState: () => void = (): void => setRouterData(data, window.location.pathname)
        const onCustomEvent: (event: Event) => void = (event): void => {
          const {
              detail: { href }
            }: { detail: { href: string } } = event as CustomEvent<{ href: string }>,
            { pathname }: { pathname: string } = new URL(href, window.location.origin)

          setRouterData(data, pathname)
        }

        window.addEventListener('popstate', onPopState)
        window.addEventListener(FICS_NAVIGATE, onCustomEvent)

        removeEventListeners = (): void => {
          window.removeEventListener('popstate', onPopState)
          window.removeEventListener(FICS_NAVIGATE, onCustomEvent)
        }
      },
      updated: hooks?.updated,
      destroyed: ({ ...args }) => {
        removeEventListeners()
        hooks?.destroyed?.({ ...args })
      },
      adopted: hooks?.adopted
    },
    options
  })
}
