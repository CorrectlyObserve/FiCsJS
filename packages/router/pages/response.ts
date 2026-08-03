import { CONTENT_TYPE, removeTrailingSlash } from '../../core/helpers'
import { SCRIPT_BASE, statusCodes } from '../constants'
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
  scriptBase = SCRIPT_BASE,
  ctx,
  path
}: Routing.Options.PageHost<C> & {
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
      script: `${removeTrailingSlash(scriptBase)}/${entry}.js`
    }),
    status
  })
}
