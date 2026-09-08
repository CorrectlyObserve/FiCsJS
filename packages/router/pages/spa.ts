import type { FiCsElement } from '../../core/class'
import { normalizePath } from '../../core/helpers'
import type { RouterData, Routing } from '../types'

export const createSpaPage =
  <D extends object, C extends Record<string, unknown>>(
    router: FiCsElement<RouterData<D>, {}>,
    spaServer?: Routing.SpaServer<D, C>
  ) =>
  async (ctx: Routing.MiddlewareCtx<C> & { status: Routing.Status.Resolved }): Promise<string> => {
    const { pathname, searchParams }: URL = new URL(ctx.req.url)

    return router.toString({
      data: {
        ...(spaServer && (await spaServer(ctx))),
        pathname: normalizePath(pathname),
        queries: Object.fromEntries(searchParams)
      } as Partial<RouterData<D>>
    })
  }
