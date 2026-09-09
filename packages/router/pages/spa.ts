import type { FiCsElement } from '../../core/class'
import { normalizePath } from '../../core/helpers'
import type { RouterData, Routing } from '../types'

export const createSpaPage =
  <D extends object, C extends Record<string, unknown>>(
    router: FiCsElement<RouterData<D>, {}>,
    initialData?: Routing.SpaInitialData<D, C>
  ) =>
  async (ctx: Routing.MiddlewareCtx<C> & { status: Routing.Status.Resolved }): Promise<string> => {
    const { pathname, searchParams }: URL = new URL(ctx.req.url)

    return router.toString({
      data: {
        ...(initialData && (await initialData(ctx))),
        pathname: normalizePath(pathname),
        queries: Object.fromEntries(searchParams)
      } as Partial<RouterData<D>>
    })
  }
