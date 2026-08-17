import { FiCsElement } from '../core/class'
import { normalizePath, NOOP, toArray, typedEntries } from '../core/helpers'
import type { DeepReadonly, Html } from '../core/types'
import { FICS_NAVIGATE, ROUTER_COMPONENT_NAME } from './constants'
import { dynamicPathToRegex, getDynamicPaths } from './dynamicPaths'
import { goto } from './goto'
import { flattenRedirects, isDynamicPath } from './helpers'
import { applyMeta } from './meta'
import { getQueries, params } from './params'
import { resolveSpec } from './registry'
import type { FiCsRouter, Page, PageContent, Returned, RouterData, Routing } from './types'

const resolveRedirect = ({
  pathname,
  redirects
}: {
  pathname: string
  redirects?: ReadonlyMap<string, string>
}): string => {
  const normalized: string = normalizePath(pathname),
    redirect: string | undefined = redirects?.get(normalized)

  if (redirect === undefined) return normalized

  const { origin, pathname: p }: { origin: string; pathname: string } = window.location,
    resolvedPath: string = normalizePath(new URL(redirect, origin).pathname)

  if (p !== resolvedPath) goto(redirect, { isWithoutHistory: true })
  return resolvedPath
}

const setRouterData = <D extends object>({
  data,
  ...args
}: {
  data: RouterData<D>
  pathname: string
  redirects?: ReadonlyMap<string, string>
}): void => {
  data.pathname = resolveRedirect(args)

  const queries: Record<string, string> = getQueries()
  data.queries = queries
  params.set('queries', queries)

  data.isNotFound = false
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
      statusModules: { notFound }
    }: Readonly<Routing.ResolvedSpec> = resolveSpec(spec),
    _pages = pages,
    _notFound = notFound

  if (_pages.length === 0) throw new Error('Please configure routes...')

  const redirectsMap: Map<string, string> = new Map<string, string>()

  if (spec?.redirects)
    for (const [from, to] of typedEntries(spec.redirects)) redirectsMap.set(normalizePath(from), to)

  for (const { path, redirect } of _pages)
    if (typeof redirect === 'string') redirectsMap.set(normalizePath(path), redirect)

  const redirects: ReadonlyMap<string, string> | undefined =
    redirectsMap.size > 0 ? flattenRedirects(redirectsMap) : undefined

  let removeEventListeners: () => void = NOOP

  return new FiCsElement<RouterData<D>, {}>({
    name: ROUTER_COMPONENT_NAME,
    children,
    data: () => ({ ...data?.(), pathname, queries: {}, isNotFound: false }) as RouterData<D>,
    immutableDataKeys: ['pathname', 'queries'],
    props,
    className,
    attributes,
    html: ({ data, template, ...args }) => {
      const pathname = normalizePath(data.pathname),
        setContent = (): Html.Sanitized<RouterData<D>, {}> => {
          const staticPages: Page<D>[] = [],
            dynamicPages: Page<D>[] = []

          for (const { path, ..._args } of _pages)
            (isDynamicPath(path) ? dynamicPages : staticPages).push({ path, ..._args } as Page<D>)

          const render = ({
            content,
            redirect,
            visited
          }: PageContent<D> & { visited?: Set<string> }): Html.Sanitized<RouterData<D>, {}> => {
            if (redirect) {
              const redirectedPath: string = normalizePath(
                  new URL(redirect, window.location.origin).pathname
                ),
                staticPage: Page<D> | undefined = staticPages.find(
                  ({ path }) => normalizePath(path) === redirectedPath
                )

              visited ??= new Set()
              if (visited.has(redirectedPath))
                throw new Error(`A redirect loop was detected at the path "${redirectedPath}"...`)

              visited.add(redirectedPath)

              if (pathname !== redirectedPath) {
                ;(data as RouterData<D>).pathname = redirectedPath
                goto(redirect, { isWithoutHistory: true })
              }

              if (staticPage) {
                params.set('dynamicPaths', {})

                const { content, redirect }: Page<D> = staticPage
                return render({ content, redirect, visited })
              }

              for (const { path, ..._args } of dynamicPages)
                if (dynamicPathToRegex(path).test(redirectedPath)) {
                  params.set('dynamicPaths', getDynamicPaths(path))
                  return render({ ..._args, visited })
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
            applyMeta({ ...defaultMeta, ...meta })
            return render({ content, redirect })
          }

          for (const { path, meta, content, redirect } of dynamicPages)
            if (dynamicPathToRegex(path).test(pathname)) {
              params.set('dynamicPaths', getDynamicPaths(path))
              applyMeta({ ...defaultMeta, ...meta })
              return render({ content, redirect })
            }

          if (_notFound) {
            ;(data as RouterData<D>).isNotFound = true
            params.set('dynamicPaths', {})
            return render(_notFound as PageContent<D>)
          }

          throw new Error(`The "${pathname}" does not exist on pages...`)
        }

      return setContent()
    },
    css: [{ ':host': { display: 'contents' } }, ...toArray(css ?? [])],
    hooks: {
      created: ({ data, ...args }) => {
        hooks?.created?.({ data, ...args })

        const onPopState: () => void = (): void =>
          setRouterData({ data, pathname: window.location.pathname, redirects })

        window.addEventListener('popstate', onPopState)

        const onCustomEvent: (event: Event) => void = (event): void => {
          const {
              detail: { href }
            }: { detail: { href: string } } = event as CustomEvent<{ href: string }>,
            { pathname }: { pathname: string } = new URL(href, window.location.origin)

          setRouterData({ data, pathname, redirects })
        }

        window.addEventListener(FICS_NAVIGATE, onCustomEvent)

        removeEventListeners = (): void => {
          window.removeEventListener('popstate', onPopState)
          window.removeEventListener(FICS_NAVIGATE, onCustomEvent)
        }

        setRouterData({ data, pathname: window.location.pathname, redirects })
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
