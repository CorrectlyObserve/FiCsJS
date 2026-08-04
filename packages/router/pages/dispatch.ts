import { removeTrailingSlash } from '../../core/helpers'
import { statusCodes } from '../constants'
import { getDynamicPaths } from '../dynamicPaths'
import { isBodiless, prependSlash } from '../helpers'
import { deny, resolveMiddlewares } from '../middleware'
import type { Routing } from '../types'
import { respond, respondPage, respondStatus } from './response'

export const dispatch = async <C extends Record<string, unknown>>({
  req,
  statics,
  dynamics,
  redirects,
  statusPages = {},
  render,
  createContext,
  scriptBase
}: Routing.ResolvedPages<C> &
  Routing.Options.InternalPageHost<C> & {
    req: Request
    statusPages?: Routing.StatusPages<C>
  }): Promise<Response> => {
  const { pathname }: URL = new URL(req.url),
    path: string = removeTrailingSlash(pathname) || '/'

  if (typeof redirects === 'function') {
    const to: string | null = redirects(pathname)
    if (typeof to === 'string') return respond(to)
  } else if (redirects instanceof Map) {
    const to: string | undefined = redirects.get(path)
    if (to !== undefined) return respond(to)
  }

  let resolvedRoute: Routing.ResolvedRoute<C> | undefined
  const _isBodiless: boolean = isBodiless(req.method)

  if (_isBodiless) resolvedRoute = statics.get(path)

  let dynamicParams: Record<string, string> = {}

  if (!resolvedRoute && _isBodiless) {
    const _path: string = prependSlash(path)
    for (const { regex, ...args } of dynamics)
      if (regex.test(_path)) {
        resolvedRoute = args
        dynamicParams = getDynamicPaths(resolvedRoute.path, _path)
        break
      }
  }

  const createCtx = <T>(ctx: T): Routing.MiddlewareCtx<C> =>
    ({ ...(ctx ?? {}), req, dynamicParams, deny, signal: req.signal }) as Routing.MiddlewareCtx<C>

  const args: { render: Routing.Options.PageHost<C>['render']; scriptBase: string; path: string } =
    { render, scriptBase, path }
  try {
    const ctx: Routing.MiddlewareCtx<C> = createCtx((await createContext?.(req)) ?? {})

    if (!resolvedRoute)
      return await respondStatus({ statusPages, status: statusCodes.NOT_FOUND, ctx, ...args })

    const denial: Routing.Denial | undefined = await resolveMiddlewares(
      resolvedRoute.middlewares,
      ctx
    )
    if (denial)
      return denial.redirect
        ? respond(denial.redirect)
        : await respondStatus({ statusPages, status: denial.code, ctx, ...args })

    // await (not bare return) so a throw inside page render is caught below and routed to 500.
    return await respondPage({ statusPage: resolvedRoute, status: statusCodes.OK, ctx, ...args })
  } catch (error) {
    console.error(
      `The dispatch function failed to process the request for the path "${path}"...`,
      error
    )

    if (statusCodes.INTERNAL_SERVER_ERROR in statusPages)
      return respondStatus({
        statusPages,
        status: statusCodes.INTERNAL_SERVER_ERROR,
        ctx: createCtx({ error }),
        ...args
      })

    throw error
  }
}
