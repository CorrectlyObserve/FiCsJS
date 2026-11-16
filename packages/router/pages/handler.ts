import { removeTrailingSlash } from '../../core/helpers'
import { decodeStatusCookie, encodeStatusCookie } from '../cookie'
import { dynamicPathToRegex } from '../dynamicPaths'
import { flattenRedirects, isDynamicPath, isHeadMethod, parseRedirects } from '../helpers'
import { applyLayout } from '../layout'
import type { Routing } from '../types'
import { dispatch } from './dispatch'

export const createPageHandler = <C extends Record<string, unknown>>(
  {
    routes,
    middlewares = {},
    statusPages = {},
    statusFallback,
    redirects
  }: Routing.Options.PageManifest<C>,
  { render, createContext, scriptBase, meta, viewTransition }: Routing.Options.PageHost<C>
): ((req: Request) => Promise<Response>) => {
  const statics: Map<string, Routing.ResolvedRoute<C>> = new Map(),
    dynamics: ({ regex: RegExp } & Routing.ResolvedRoute<C>)[] = []

  for (const { path, page, entry, layout } of routes) {
    const resolved: Routing.ResolvedRoute<C> = {
      path,
      module: applyLayout({ layout: layout as Routing.ServerModule<C>, page }),
      entry,
      middlewares: middlewares[path] ?? []
    }

    if (isDynamicPath(path)) dynamics.push({ regex: dynamicPathToRegex(path), ...resolved })
    else statics.set(path, resolved)
  }

  let _redirects: Routing.Redirects | undefined,
    _prefixes: readonly (readonly [prefix: string, to: string])[] = []

  if (redirects)
    if (typeof redirects === 'function') _redirects = redirects
    else {
      const { exact, prefixes }: ReturnType<typeof parseRedirects> = parseRedirects(redirects)
      _redirects = flattenRedirects(exact)
      _prefixes = prefixes
    }

  return async (req: Request): Promise<Response> => {
    const res: Response = await dispatch({
      req,
      statics,
      dynamics,
      redirects: _redirects,
      prefixes: _prefixes,
      statusPages,
      statusFallback,
      render,
      createContext,
      scriptBase: removeTrailingSlash(scriptBase ?? '/assets'),
      meta,
      viewTransition
    })

    /** @remarks Clears the status cookie unconditionally, as the next request must render the normal page. */
    if (decodeStatusCookie(req.headers.get('cookie') ?? '') !== null)
      res.headers.append('set-cookie', encodeStatusCookie(null, new URL(req.url).pathname))

    if (isHeadMethod(req.method))
      return new Response(null, { status: res.status, headers: res.headers })

    return res
  }
}
