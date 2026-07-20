import { statusCodes } from './constants'
import { applyLayout } from './layout'
import type { Routing } from './types'

export const registerPages = <C extends Record<string, unknown>>(
  app: {
    get: (path: string, handler: (ctx: Routing.Host) => unknown) => unknown
    use: (middleware: (ctx: Routing.Host, next: () => Promise<void>) => unknown) => unknown
    /** @remarks Workaround for strict notFound types in host frameworks　*/
    notFound: (handler: any) => unknown
  },
  routes: Routing.ServerRoute<C>[],
  {
    render,
    createContext,
    toHostRoutePath,
    serverError,
    notFound,
    redirects
  }: Routing.Options.Register<C>
): void => {
  if (typeof redirects === 'function')
    app.use(
      async ({ req, redirect }: Routing.Host, next: () => Promise<void>): Promise<unknown> => {
        const { path }: { path?: unknown } = req as { path?: unknown }

        if (typeof path === 'string') {
          const redirected: string | null = redirects(path)
          if (typeof redirected === 'string') return redirect(redirected, statusCodes.REDIRECT)
        }

        await next()
        return undefined
      }
    )
  else if (redirects)
    for (const [from, to] of Object.entries(redirects))
      app.get(from, ({ redirect }: Routing.Host) => redirect(to, statusCodes.REDIRECT))

  for (const { path, module, entry, layout } of routes) {
    const { meta = {}, default: def }: Routing.ServerModule<C> = applyLayout({
      layout: layout as Routing.ServerModule<C>,
      page: module
    })

    app.get(toHostRoutePath(path), async (ctx: Routing.Host) => {
      const _ctx: C & { req: unknown } = { ...(createContext?.(ctx) ?? ({} as C)), req: ctx.req }

      try {
        return ctx.html(render({ meta, content: def ? await def(_ctx) : '', path }))
      } catch (error) {
        if (!serverError) throw error

        const { meta: errorMeta = {}, default: errorDef } = serverError
        return ctx.html(
          render({
            meta: errorMeta,
            content: errorDef ? await errorDef({ ..._ctx, error }) : '',
            path
          }),
          statusCodes.INTERNAL_SERVER_ERROR
        )
      }
    })
  }

  if (notFound) {
    const { meta = {}, default: def }: Routing.ServerModule<C> = notFound

    app.notFound(async (ctx: Routing.Host) => {
      const _ctx: C & { req: unknown } = { ...(createContext?.(ctx) ?? ({} as C)), req: ctx.req },
        path: string = (ctx.req as { path?: string }).path ?? ''

      return ctx.html(
        render({ meta, content: def ? await def(_ctx) : '', path }),
        statusCodes.NOT_FOUND
      )
    })
  }
}
