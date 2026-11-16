import { normalizePath } from '../core/helpers'
import { statusCodes } from './constants'
import { goto } from './goto'
import { getQueries, params } from './params'
import type { RouterData, Routing } from './types'

const resolveRedirect = ({
  pathname,
  redirects
}: {
  pathname: string
  redirects?: ReadonlyMap<string, string>
}): string => {
  const normalized: string = normalizePath(pathname),
    redirect: string | undefined = redirects?.get(normalized)

  if (redirect === undefined) return normalized

  const { origin, pathname: p }: { origin: string; pathname: string } = window.location,
    resolvedPath: string = normalizePath(new URL(redirect, origin).pathname)

  if (p !== resolvedPath) goto(redirect, { isWithoutHistory: true })
  return resolvedPath
}

/**
 * @remarks
 * Must preserve this exact order:
 * status (fail-fast) -> dynamicParams (identity) -> queries (modifier) -> pathname (render trigger).
 */
export const patchRouterData = <D extends object>(
  data: RouterData<D>,
  {
    status,
    dynamicParams,
    queries,
    pathname
  }: {
    status?: Routing.Status.Resolved
    dynamicParams?: Record<string, string>
    queries?: Record<string, string>
    pathname?: string
  }
): void => {
  if (status !== undefined) data.status = status

  if (dynamicParams) {
    data.dynamicParams = dynamicParams
    params.set('dynamicParams', dynamicParams)
  }

  if (queries) {
    data.queries = queries
    params.set('queries', queries)
  }

  if (pathname !== undefined) data.pathname = pathname
}

export const setRouterData = <D extends object>({
  data,
  toDynamicParams,
  pathname,
  redirects
}: {
  data: RouterData<D>
  toDynamicParams: (pathname: string) => Record<string, string>
  pathname: string
  redirects?: ReadonlyMap<string, string>
}): void => {
  const resolvedPathname: string = resolveRedirect({ pathname, redirects })

  patchRouterData(data, {
    status: statusCodes.OK,
    dynamicParams: toDynamicParams(resolvedPathname),
    queries: getQueries(),
    pathname: resolvedPathname
  })
}
