import { FiCsElement } from '../core/class'
import { CSS_LAYER, HOST_SELECTOR, NOOP, normalizePath, toArray } from '../core/helpers'
import type { FiCs } from '../core/namespaces'
import type { DeepReadonly, Html } from '../core/types'
import {
  FICS_CAN_NAVIGATE,
  FICS_NAVIGATE,
  FICS_STATUS,
  RESERVED_ROUTER_DATA_KEYS,
  ROUTER_COMPONENT_NAME,
  statusCodes
} from './constants'
import { dynamicPathToRegex, getDynamicParams } from './dynamicPaths'
import { goto } from './goto'
import {
  findRedirect,
  flattenRedirects,
  isDynamicPath,
  isStatusOk,
  parseRedirects
} from './helpers'
import { applyMeta, resolveMeta } from './meta'
import { canNavigate } from './navigation'
import { patchRouterData, setRouterData } from './routerData'
import { resolveSpec } from './spec'
import type { FiCsRouter, Page, PageContent, Returned, RouterData, Routing } from './types'

export const ficsRouter = <D extends object>(
  spa: FiCsRouter<D>,
  spec: Routing.Spec
): FiCsElement<RouterData<D>, {}> => {
  const {
      children,
      data,
      deferredData,
      pathname = '/',
      meta: defaultMeta,
      props,
      className,
      attributes,
      css: _css,
      hooks: _hooks,
      options
    }: FiCsRouter<D> = spa,
    resolved: Readonly<Routing.ResolvedSpec> = resolveSpec(spec)

  if (resolved.pages.length === 0)
    throw new Error('Add a page to the SPA, as the router has no pages...')

  const ownPaths: string[] = resolved.pages.map(({ path }) => path),
    toDynamicParams = (pathname: string): Record<string, string> => {
      const normalized: string = normalizePath(pathname)
      let fallback: Record<string, string> | null = null

      for (const { path } of resolved.pages) {
        const isDynamic: boolean = isDynamicPath(path)

        if (!isDynamic && normalizePath(path) === normalized) return {}

        if (!fallback && isDynamic && dynamicPathToRegex(path).test(normalized))
          fallback = getDynamicParams(path, normalized)
      }

      return fallback || {}
    }

  let hasWarned: boolean = false

  const html: FiCs.Html<RouterData<D>, {}> = ({ data, template, ...args }) => {
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
                patchRouterData(data, {
                  dynamicParams: toDynamicParams(redirectedPath),
                  pathname: redirectedPath
                })
                goto(redirect, { isWithoutHistory: true })
              }

              if (staticPage) {
                const { content, redirect }: Page<D> = staticPage
                return render({ content, redirect, visited })
              }

              for (const { path: pattern, ..._args } of dynamicPages)
                if (dynamicPathToRegex(pattern).test(redirectedPath))
                  return render({ ..._args, visited })

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
            patchRouterData(data, { status, dynamicParams: {} })

            const statusModule: PageContent<D> | undefined = (
              isStatusOk(status)
                ? undefined
                : (resolved.statusModules[status] ?? resolved.statusFallback)
            ) as PageContent<D> | undefined

            applyMeta(resolveMeta({ defaultMeta, meta: statusModule?.meta, status }))

            return statusModule ? render(statusModule) : template`<h1>${status}</h1>`
          }

          if (!isStatusOk(data.status)) return renderStatus(data.status)

          const staticPage: Page<D> | undefined = staticPages.find(
            ({ path }) => pathname === normalizePath(path)
          )
          if (staticPage) {
            const { meta, content, redirect }: Page<D> = staticPage
            applyMeta(resolveMeta({ defaultMeta, meta, status: statusCodes.OK }))

            return render({ content, redirect })
          }

          for (const { path: pattern, meta, content, redirect } of dynamicPages)
            if (dynamicPathToRegex(pattern).test(pathname)) {
              applyMeta(resolveMeta({ defaultMeta, meta, status: statusCodes.OK }))

              return render({ content, redirect })
            }

          const redirectTarget: string | null = findRedirect(pathname, prefixes)
          if (redirectTarget !== null) return render({ redirect: redirectTarget })

          return renderStatus(statusCodes.NOT_FOUND)
        }

      return setContent()
    },
    css: FiCsRouter<D>['css'] = [
      `${CSS_LAYER}{${HOST_SELECTOR}{display:contents;}}`,
      ...toArray(_css ?? [])
    ],
    { exact: redirectsMap, prefixes }: ReturnType<typeof parseRedirects> = parseRedirects(
      spec.redirects ?? {}
    )

  for (const { path, redirect } of resolved.pages)
    if (typeof redirect === 'string') redirectsMap.set(normalizePath(path), redirect)

  const redirects: ReadonlyMap<string, string> | undefined =
    redirectsMap.size > 0 ? flattenRedirects(redirectsMap) : undefined

  let removeEventListeners: () => void = NOOP

  const hooks: FiCsRouter<D>['hooks'] = {
    created: ({ data, ...args }) => {
      _hooks?.created?.({ data, ...args })

      const onPopState: () => void = (): void =>
        setRouterData({ data, toDynamicParams, pathname: window.location.pathname, redirects })

      window.addEventListener('popstate', onPopState)

      const onNavigate: (event: Event) => void = (event): void => {
          const {
              detail: { href }
            }: { detail: { href: string } } = event as CustomEvent<{ href: string }>,
            { pathname }: { pathname: string } = new URL(href, window.location.origin)

          setRouterData({ data, toDynamicParams, pathname, redirects })
        },
        setCanNavigate = (event: Event): void => {
          const { detail }: { detail: Routing.CanNavigateEvent } =
            event as CustomEvent<Routing.CanNavigateEvent>

          /** @remarks Passes if at least one router matches, as this flag is only ever set to true. */
          if (
            canNavigate({
              href: detail.href,
              currentHref: window.location.href,
              basePath: pathname,
              ownPaths,
              appPaths: spec.appPaths,
              redirects
            })
          )
            detail.canNavigate = true
        },
        onStatus: (event: Event) => void = (event: Event): void => {
          const { detail }: { detail: Routing.Status.Event } =
            event as CustomEvent<Routing.Status.Event>

          if (detail.isHandled) return

          detail.isHandled = true
          patchRouterData(data, { status: detail.code })
        }

      window.addEventListener(FICS_NAVIGATE, onNavigate)
      window.addEventListener(FICS_CAN_NAVIGATE, setCanNavigate)
      window.addEventListener(FICS_STATUS, onStatus)

      removeEventListeners = (): void => {
        window.removeEventListener('popstate', onPopState)
        window.removeEventListener(FICS_NAVIGATE, onNavigate)
        window.removeEventListener(FICS_CAN_NAVIGATE, setCanNavigate)
        window.removeEventListener(FICS_STATUS, onStatus)
      }

      onPopState()
    },
    mounted: _hooks?.mounted,
    updated: _hooks?.updated,
    destroyed: ({ ...args }) => {
      removeEventListeners()
      _hooks?.destroyed?.({ ...args })
    },
    adopted: _hooks?.adopted
  }

  return new FiCsElement<RouterData<D>, {}>({
    name: ROUTER_COMPONENT_NAME,
    children,
    data: () => {
      const _data: D | object = data?.() ?? {}

      if (!hasWarned) {
        hasWarned = true

        const reservedKeys: string[] = RESERVED_ROUTER_DATA_KEYS.filter(key => key in _data),
          { length }: { length: number } = reservedKeys

        if (length > 0)
          console.warn(
            `Rename data key${length > 1 ? 's' : ''} "${reservedKeys.join('", "')}", as ${length > 1 ? 'they are' : 'it is'} reserved by the router...`
          )
      }

      return {
        ..._data,
        pathname,
        dynamicParams: {},
        queries: {},
        status: statusCodes.OK
      } as RouterData<D>
    },
    immutableDataKeys: ['pathname', 'dynamicParams', 'queries'],
    deferredData,
    props,
    className,
    attributes,
    html,
    css,
    hooks,
    options
  })
}
