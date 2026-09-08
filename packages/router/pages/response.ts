import { getGlobalCss } from '../../core/globalCss'
import { CONTENT_TYPE } from '../../core/helpers'
import { statusCodes } from '../constants'
import { injectMeta, renderMeta, resolveMeta } from '../meta'
import type { Routing } from '../types'

export function respond(
  arg: { html: string; status: Routing.Status.Code; noStore?: boolean } | string
): Response {
  if (typeof arg === 'string')
    return new Response(null, { status: statusCodes.REDIRECT, headers: { location: arg } })

  return new Response(arg.html, {
    status: arg.status,
    headers: {
      [CONTENT_TYPE]: 'text/html; charset=utf-8',
      ...(arg.noStore ? { 'cache-control': 'no-store' } : {})
    }
  })
}

export const respondPage = async <C extends Record<string, unknown>>({
  page,
  status,
  render,
  scriptBase,
  meta: defaultMeta,
  ctx,
  path
}: Routing.Options.InternalPageHost<C> & {
  page: { module: Routing.ServerModule<C>; entry: string }
  status: Routing.Status.Resolved
  ctx: Routing.MiddlewareCtx<C>
  path: string
}): Promise<Response> => {
  const {
      module: { meta = {}, default: def },
      entry
    } = page,
    resolvedMeta: Record<string, string> = resolveMeta({ defaultMeta, meta, status }),
    html: string = render({
      meta: resolvedMeta,
      content: def ? await def({ ...ctx, status }) : '',
      path,
      script: `${scriptBase}/${entry}.js`,
      styles: getGlobalCss()
    })

  return respond({ html: injectMeta({ html, metaTags: renderMeta(resolvedMeta) }), status })
}

export const respondStatus = async <C extends Record<string, unknown>>({
  statusPages,
  status,
  statusFallback,
  ...args
}: Omit<Parameters<typeof respondPage<C>>[0], 'page' | 'status'> &
  Routing.Status.Manifest<C> & { status: Routing.Status.PageCode }): Promise<Response> => {
  const page: Routing.Status.Page<C> | undefined = statusPages[status] ?? statusFallback
  return page
    ? respondPage({ page, status, ...args })
    : respond({ html: `<h1>${status}</h1>`, status })
}
