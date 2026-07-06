import { FiCsElement } from '../core/class'
import { normalizePath } from '../core/helpers'
import type { DeepReadonly, Html } from '../core/types'
import { FICS_NAVIGATE } from './constants'
import { dynamicPathToRegex, dynamicRegex, getDynamicPaths } from './dynamicPaths'
import { goto } from './goto'
import { applyMeta } from './meta'
import { getQueries, params } from './params'
import { resolveRouting } from './registry'
import type { FiCsRouter, Page, PageContent, Returned, RouterData, Routing } from './types'

const resolveRedirect = ({ pathname, redirectMap, redirectFn }: Routing.Redirect): string => {
  const normalized: string = normalizePath(pathname)
  let redirect: string | undefined = redirectMap.get(normalized)

  if (redirect === undefined && redirectFn) {
    const result: string | null = redirectFn(normalized)
    if (typeof result === 'string') redirect = result
  }
  if (redirect === undefined) return normalized

  const { origin, pathname: p } = window.location,
    resolvedPath: string = normalizePath(new URL(redirect, origin).pathname)

  if (p !== resolvedPath) goto(redirect, { isWithoutHistory: true })
  return resolvedPath
}

const setRouterData = <D extends object>({
  data,
  pathname,
  redirectMap,
  redirectFn
}: Routing.Redirect & { data: RouterData<D> }): void => {
  const queries: Record<string, string> = getQueries()

  data.pathname = resolveRedirect({ pathname, redirectMap, redirectFn })
  data.queries = queries
  params.set('queries', queries)
}

export const ficsRouter = <D extends object>(
  config: FiCsRouter<D>,
  spec?: Routing.Spec
): FiCsElement<RouterData<D>, {}> => {
  const {
      children,
      data,
      pathname = '/',
      props,
      className,
      attributes,
      css,
      hooks,
      options
    }: FiCsRouter<D> = config,
    {
      pages,
      statusModules: { notFound },
      redirectFn
    }: Readonly<Routing.Resolved> = resolveRouting(spec),
    _pages = pages as Page<D>[],
    _notFound = notFound as PageContent<D> | undefined

  if (_pages.length === 0) throw new Error('Please configure routes...')

  const redirectMap: ReadonlyMap<string, string> = new Map(
    _pages
      .filter(({ redirect }) => typeof redirect === 'string')
      .map(({ path, redirect }) => [normalizePath(path), redirect!])
  )
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

          for (const { path, ..._args } of _pages) {
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
                ;(data as RouterData<D>).pathname = redirectedPath
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
                data: data as DeepReadonly.Core<RouterData<D>>,
                template,
                ...args
              })

              return _content instanceof FiCsElement ? template`${_content}` : _content
            }

            throw new Error('Either "content" or "redirect" must be specified...')
          }

          const staticPage: Page<D> | undefined = staticPages.find(
            ({ path }) => pathname === normalizePath(path)
          )
          if (staticPage) {
            params.set('dynamicPaths', {})

            const { meta, content, redirect }: Page<D> = staticPage
            applyMeta(meta)
            return render({ content, redirect })
          }

          for (const { path, meta, content, redirect } of dynamicPages)
            if (dynamicPathToRegex(path).test(pathname)) {
              params.set('dynamicPaths', getDynamicPaths(path))
              applyMeta(meta)
              return render({ content, redirect })
            }

          if (_notFound) {
            ;(data as RouterData<D>).pathname = '/404'
            params.set('dynamicPaths', {})
            goto('/404', { isWithoutHistory: true })
            return render(_notFound)
          }

          throw new Error(`The "${pathname}" does not exist on pages...`)
        }

      return setContent()
    },
    css,
    hooks: {
      created: ({ data, ...args }) => {
        hooks?.created?.({ data, ...args })

        const onPopState: () => void = (): void =>
          setRouterData({ data, pathname: window.location.pathname, redirectMap, redirectFn })

        window.addEventListener('popstate', onPopState)

        const onCustomEvent: (event: Event) => void = (event): void => {
          const {
              detail: { href }
            }: { detail: { href: string } } = event as CustomEvent<{ href: string }>,
            { pathname }: { pathname: string } = new URL(href, window.location.origin)

          setRouterData({ data, pathname, redirectMap, redirectFn })
        }

        window.addEventListener(FICS_NAVIGATE, onCustomEvent)

        removeEventListeners = (): void => {
          window.removeEventListener('popstate', onPopState)
          window.removeEventListener(FICS_NAVIGATE, onCustomEvent)
        }

        setRouterData({ data, pathname: window.location.pathname, redirectMap, redirectFn })
      },
      mounted: hooks?.mounted,
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
