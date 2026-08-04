import { removeTrailingSlash, typedEntries } from '../../core/helpers'
import { dynamicPathToRegex } from '../dynamicPaths'
import { isDynamicPath, isHeadMethod } from '../helpers'
import { applyLayout } from '../layout'
import type { Routing } from '../types'
import { dispatch } from './dispatch'

export const createPageHandler = <C extends Record<string, unknown>>(
  { routes, middlewares = {}, statusPages = {}, redirects }: Routing.Options.PageManifest<C>,
  { render, createContext, scriptBase }: Routing.Options.PageHost<C>
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

  let _redirects: Routing.Redirects | undefined
  if (redirects)
    _redirects =
      typeof redirects === 'function'
        ? redirects
        : new Map(
            typedEntries(redirects).map(([from, to]) => [removeTrailingSlash(from) || '/', to])
          )

  const sb: string = removeTrailingSlash(scriptBase ?? '/dist')
  return async (req: Request): Promise<Response> => {
    const res: Response = await dispatch({
      req,
      statics,
      dynamics,
      redirects: _redirects,
      statusPages,
      render,
      createContext,
      scriptBase: sb
    })

    if (isHeadMethod(req.method))
      return new Response(null, { status: res.status, headers: res.headers })

    return res
  }
}
