import { browserError } from '../core/helpers'
import { FICS_STATUS, statusCodes } from './constants'
import type { PageContent, Routing } from './types'

export const findStatusModule = <D extends object>({
  status,
  statusModules,
  statusFallback
}: { status: Routing.Status.Resolved } & Pick<
  Routing.ResolvedSpec,
  'statusModules' | 'statusFallback'
>): PageContent<D> | undefined =>
  status === statusCodes.OK
    ? undefined
    : ((statusModules[status] ?? statusFallback) as PageContent<D> | undefined)

export const showStatus = (code: Routing.Status.PageCode): void => {
  browserError()

  const detail: Routing.Status.Event = { code, isHandled: false }
  window.dispatchEvent(new CustomEvent(FICS_STATUS, { detail }))

  if (!detail.isHandled)
    console.warn(`The showStatus(${code}) call was ignored as no router is currently mounted...`)
}
