import { FiCsElement } from '../core/class'
import { CSS_LAYER, NOOP, normalizePath, toArray } from '../core/helpers'
import type { DeepReadonly, Html } from '../core/types'
import {
  FICS_NAVIGATE,
  FICS_STATUS,
  RESERVED_ROUTER_DATA_KEYS,
  ROUTER_COMPONENT_NAME,
  statusCodes
} from './constants'
import { dynamicPathToRegex, getDynamicPaths } from './dynamicPaths'
import { goto } from './goto'
import { findRedirect, flattenRedirects, isDynamicPath, parseRedirects } from './helpers'
import { applyMeta, resolveMeta } from './meta'
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
  data.status = statusCodes.OK

  data.pathname = resolveRedirect(args)

  const queries: Record<string, string> = getQueries()
  data.queries = queries
  params.set('queries', queries)
}

export const ficsRouter = <D extends object>(
  spa: FiCsRouter<D>,
  spec?: Routing.Spec
): FiCsElement<RouterData<D>, {}> => {
  const {
      children,
      data,
      pathname = '/',
      meta: defaultMeta,
      props,
      className,
      attributes,
      css,
      hooks,
      options
    }: FiCsRouter<D> = spa,
    resolved: Readonly<Routing.ResolvedSpec> = resolveSpec(spec)

  if (resolved.pages.length === 0)
    throw new Error('Pass a spec or call registerRoutes first as the router has no pages...')

  const { exact: redirectsMap, prefixes }: ReturnType<typeof parseRedirects> = parseRedirects(
    spec?.redirects ?? {}
  )

  for (const { path, redirect } of resolved.pages)
    if (typeof redirect === 'string') redirectsMap.set(normalizePath(path), redirect)

  const redirects: ReadonlyMap<string, string> | undefined =
    redirectsMap.size > 0 ? flattenRedirects(redirectsMap) : undefined

  let removeEventListeners: () => void = NOOP,
    hasWarned: boolean = false

  return new FiCsElement<RouterData<D>, {}>({
    name: ROUTER_COMPONENT_NAME,
    children,
    data: () => {
      const _data: D | object = data?.() ?? {}

      if (!hasWarned) {
        hasWarned = true

        const reservedKeys: string[] = RESERVED_ROUTER_DATA_KEYS.filter(key => key in _data),
          { length } = reservedKeys

        if (length > 0) {
          console.warn(
            `Please rename data key${length > 1 ? 's' : ''} "${reservedKeys.join('", "')}" as ${length > 1 ? 'they are' : 'it is'} reserved by the router...`
          )
        }
      }

      return { ..._data, pathname, queries: {}, status: statusCodes.OK } as RouterData<D>
    },
    immutableDataKeys: ['pathname', 'queries'],
    props,
    className,
    attributes,
    html: ({ data, template, ...args }) => {
      const pathname = normalizePath(data.pathname),
        setContent = (): Html.Sanitized<RouterData<D>, {}> => {
          const staticPages: Page<D>[] = [],
            dynamicPages: Page<D>[] = []

          for (const { path, ..._args } of resolved.pages)
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

          const renderStatus = (
            status: Routing.Status.Resolved
          ): Html.Sanitized<RouterData<D>, {}> => {
            ;(data as RouterData<D>).status = status
            params.set('dynamicPaths', {})

            const statusModule: PageContent<D> | undefined = (
              status === statusCodes.OK
                ? undefined
                : (resolved.statusModules[status] ?? resolved.statusFallback)
            ) as PageContent<D> | undefined

            applyMeta(resolveMeta({ defaultMeta, meta: statusModule?.meta, status }))

            return statusModule ? render(statusModule) : template`<h1>${status}</h1>`
          }

          if (data.status !== statusCodes.OK) return renderStatus(data.status)

          const staticPage: Page<D> | undefined = staticPages.find(
            ({ path }) => pathname === normalizePath(path)
          )
          if (staticPage) {
            params.set('dynamicPaths', {})

            const { meta, content, redirect }: Page<D> = staticPage
            applyMeta(resolveMeta({ defaultMeta, meta, status: statusCodes.OK }))

            return render({ content, redirect })
          }

          for (const { path, meta, content, redirect } of dynamicPages)
            if (dynamicPathToRegex(path).test(pathname)) {
              params.set('dynamicPaths', getDynamicPaths(path))
              applyMeta(resolveMeta({ defaultMeta, meta, status: statusCodes.OK }))

              return render({ content, redirect })
            }

          const redirectTarget: string | null = findRedirect(pathname, prefixes)
          if (redirectTarget !== null) return render({ redirect: redirectTarget })

          return renderStatus(statusCodes.NOT_FOUND)
        }

      return setContent()
    },
    css: [`${CSS_LAYER}{:host{display:contents;}}`, ...toArray(css ?? [])],
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

        const onStatus: (event: Event) => void = (event: Event): void => {
          const { detail }: { detail: Routing.Status.Event } =
            event as CustomEvent<Routing.Status.Event>

          if (detail.isHandled) return

          detail.isHandled = true
          ;(data as RouterData<D>).status = detail.code
        }

        window.addEventListener(FICS_STATUS, onStatus)

        removeEventListeners = (): void => {
          window.removeEventListener('popstate', onPopState)
          window.removeEventListener(FICS_NAVIGATE, onCustomEvent)
          window.removeEventListener(FICS_STATUS, onStatus)
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
