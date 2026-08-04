import { CONTENT_TYPE } from '../../core/helpers'
import { statusCodes } from '../constants'
import type { Routing } from '../types'

export function respond({ html, status }: { html: string; status: Routing.StatusCode }): Response
export function respond(location: string): Response
export function respond(arg: { html: string; status: Routing.StatusCode } | string): Response {
  if (typeof arg === 'string')
    return new Response(null, { status: statusCodes.REDIRECT, headers: { location: arg } })

  return new Response(arg.html, {
    status: arg.status,
    headers: { [CONTENT_TYPE]: 'text/html; charset=utf-8' }
  })
}

export const respondPage = async <C extends Record<string, unknown>>({
  statusPage,
  status,
  render,
  scriptBase,
  ctx,
  path
}: Routing.Options.InternalPageHost<C> & {
  statusPage: Routing.ServerStatus<C>
  status: Routing.StatusPageCode | (typeof statusCodes)['OK']
  ctx: Routing.MiddlewareCtx<C>
  path: string
}): Promise<Response> => {
  const {
    module: { meta = {}, default: def },
    entry
  }: Routing.ServerStatus<C> = statusPage

  return respond({
    html: render({
      meta,
      content: def ? await def(ctx) : '',
      path,
      script: `${scriptBase}/${entry}.js`
    }),
    status
  })
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
