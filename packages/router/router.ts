import FiCsElement from '../core/class'
import type { Descendant, Sanitized } from '../core/types'
import { dynamicPathToRegex, dynamicRegex, getDynamicPaths } from './dynamicPaths'
import goto from './goto'
import { getQueries, params } from './params'
import type { FiCsRouter, Page, PageContent, RouterData } from './types'

const setRouterData = <D extends object>(
  setData: <K extends keyof RouterData<D>>(key: K, value: RouterData<D>[K]) => void,
  pathname: string
): void => {
  const queries: Record<string, string> = getQueries()

  setData('pathname', pathname as RouterData<D>['pathname'])
  setData('queries', queries as RouterData<D>['queries'])
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
}: FiCsRouter<D>): FiCsElement<RouterData<D>, {}> =>
  new FiCsElement<RouterData<D>, {}>({
    name: 'router',
    isExceptional: true,
    children,
    data: () => ({ ...data?.(), pathname, queries: {} }) as RouterData<D>,
    props,
    className,
    attributes,
    html: ({ data, template, setData, ...args }) => {
      const setContent = (): Sanitized<RouterData<D>, {}> => {
        const { pathname } = data,
          staticPages: Page<D>[] = [],
          dynamicPages: Page<D>[] = []

        for (const { path, ...args } of pages)
          dynamicRegex.test(path)
            ? dynamicPages.push({ path, ...args })
            : staticPages.push({ path, ...args })

        const render = ({ content, redirect }: PageContent<D>): Sanitized<RouterData<D>, {}> => {
          if (redirect) {
            if (pathname !== redirect) {
              setData('pathname', redirect as RouterData<D>['pathname'])
              goto(redirect, true)
            }

            const staticPage: Page<D> | undefined = staticPages.find(
              ({ path }) => path === redirect
            )
            if (staticPage) {
              const { content, redirect } = staticPage
              return render({ content, redirect })
            }

            for (const { path, ...args } of dynamicPages)
              if (dynamicPathToRegex(path).test(redirect)) {
                params.set('dynamicPaths', getDynamicPaths(path))
                return render({ ...args })
              }

            throw new Error(`The redirect path "${redirect}" does not exist on pages...`)
          }

          if (content) {
            const _content: Descendant | Sanitized<RouterData<D>, {}> = content({
              data,
              template,
              setData: <K extends keyof RouterData<D>>(key: K, value: RouterData<D>[K]) => {
                if (key === 'pathname' || key === 'queries')
                  throw new Error(
                    `The "${key as string}" cannot be modified in the router component...`
                  )

                setData(key, value)
              },
              ...args
            })

            return _content instanceof FiCsElement ? template`${_content}` : _content
          }

          throw new Error('Either "content" or "redirect" must be specified...')
        }

        if (pathname === '/404' && notFound) return render(notFound)

        const staticPage: Page<D> | undefined = staticPages.find(({ path }) => pathname === path)
        if (staticPage) {
          const { content, redirect } = staticPage
          return render({ content, redirect })
        }

        for (const { path, ...args } of dynamicPages)
          if (dynamicPathToRegex(path).test(pathname)) {
            params.set('dynamicPaths', getDynamicPaths(path))
            return render({ ...args })
          }

        if (notFound) {
          goto('/404', true)
          return render(notFound)
        }
        throw new Error(`The "${pathname}" does not exist on pages...`)
      }

      return setContent()
    },
    css,
    hooks: {
      created: ({ data, setData, getData, crud }) => {
        hooks?.created?.({ data, props: {}, setData, getData, crud })
        setRouterData(setData, window.location.pathname)
      },
      mounted: ({ data, setData, getData, crud, poll }) => {
        hooks?.mounted?.({ data, props: {}, setData, getData, crud, poll })

        window.addEventListener('popstate', () => setRouterData(setData, window.location.pathname))
        window.addEventListener('fics:navigate', (event: Event) => {
          const {
              detail: { href }
            }: { detail: { href: string } } = event as CustomEvent<{ href: string }>,
            { pathname }: { pathname: string } = new URL(href, window.location.origin)

          setRouterData(setData, pathname)
        })
      },
      updated: hooks?.updated,
      destroyed: hooks?.destroyed,
      adopted: hooks?.adopted
    },
    options
  })
