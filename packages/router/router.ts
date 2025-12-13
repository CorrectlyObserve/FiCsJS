import FiCsElement from '../core/class'
import { normalizePath } from '../core/helpers'
import type { Data, Descendant, Sanitized } from '../core/types'
import CUSTOM_EVENT_NAME from './const'
import { dynamicPathToRegex, dynamicRegex, getDynamicPaths } from './dynamicPaths'
import goto from './goto'
import { getQueries, params } from './params'
import type { FiCsRouter, Page, PageContent, RouterData } from './types'

const setRouterData = <D extends object>(data: Data<RouterData<D>>, pathname: string): void => {
  const queries: Record<string, string> = getQueries()

  data.pathname.set(pathname as RouterData<D>['pathname'])
  data.queries.set(queries as RouterData<D>['queries'])
  params.set('queries', queries)
}

export default <D extends object>({
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
      const pathname = normalizePath(data.pathname.get() as string)

      const setContent = (): Sanitized<RouterData<D>, {}> => {
        const staticPages: Page<D>[] = [],
          dynamicPages: Page<D>[] = []

        for (const { path, ..._args } of pages) {
          dynamicRegex.lastIndex = 0

          const _pages: Page<D>[] = dynamicRegex.test(path) ? dynamicPages : staticPages
          _pages.push({ path, ..._args })
        }

        const render = ({ content, redirect }: PageContent<D>): Sanitized<RouterData<D>, {}> => {
          if (redirect) {
            const redirectedPath: string = normalizePath(
                new URL(redirect, window.location.origin).pathname
              ),
              staticPage: Page<D> | undefined = staticPages.find(
                ({ path }) => normalizePath(path) === redirectedPath
              )

            if (pathname !== redirectedPath) {
              data.pathname.set(redirectedPath as RouterData<D>['pathname'])
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
            const _content: Descendant | Sanitized<RouterData<D>, {}> = content({
              ...Object.fromEntries(
                Object.keys(data).map(key => {
                  const _key = key as keyof D
                  return [_key, data[_key].get()]
                })
              ),
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
          data.pathname.set('/404' as RouterData<D>['pathname'])
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
        window.addEventListener(CUSTOM_EVENT_NAME, onCustomEvent)

        removeEventListeners = (): void => {
          window.removeEventListener('popstate', onPopState)
          window.removeEventListener(CUSTOM_EVENT_NAME, onCustomEvent)
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
