import { CONTENT_TYPE } from '../../core/helpers'
import { STATUS_PAGE_META, statusCodes } from '../constants'
import { injectMeta, renderMeta } from '../meta'
import type { Routing } from '../types'

export function respond({ html, status }: { html: string; status: Routing.Status.Code }): Response
export function respond(location: string): Response
export function respond(arg: { html: string; status: Routing.Status.Code } | string): Response {
  if (typeof arg === 'string')
    return new Response(null, { status: statusCodes.REDIRECT, headers: { location: arg } })

  return new Response(arg.html, {
    status: arg.status,
    headers: { [CONTENT_TYPE]: 'text/html; charset=utf-8' }
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
    resolvedMeta: Record<string, string> = {
      ...defaultMeta,
      ...(status === statusCodes.OK ? {} : STATUS_PAGE_META),
      ...meta
    },
    html: string = render({
      meta: resolvedMeta,
      content: def ? await def({ ...ctx, status }) : '',
      path,
      script: `${scriptBase}/${entry}.js`
    })

  return respond({ html: injectMeta({ html, metaTags: renderMeta(resolvedMeta) }), status })
}

export const respondStatus = async <C extends Record<string, unknown>>({
  statusPages,
  status,
  ...args
}: Routing.Options.InternalPageHost<C> & {
  statusPages: Routing.StatusPages<C>
  status: Routing.StatusPageCode
  ctx: Routing.MiddlewareCtx<C>
  path: string
}): Promise<Response> => {
  const statusPage: Routing.ServerStatus<C> | undefined = statusPages[status]
  return statusPage
    ? respondPage({ statusPage, status, ...args })
    : respond({ html: `<h1>${status}</h1>`, status })
}
