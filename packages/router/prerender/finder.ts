import { typedEntries } from '../../core/helpers'
import { toMessage } from '../helpers'
import type { Routing } from '../types'
import { toStaticPaths } from './paths'

export const findStaticRoutes = async <C extends Record<string, unknown>>({
  statusPages,
  routes,
  middlewares,
  statusFallback
}: Routing.Options.PageManifest<C>): Promise<Routing.Prerender.Found> => {
  const staticRoutes: Routing.Prerender.StaticRoutes = [],
    errors: string[] = [],
    /** @remarks Requires "404.html" at the root, not "404/index.html" for static hosts. */
    statusFiles: Map<Routing.ServerModule<C>, string> = new Map()

  for (const [code, page] of typedEntries(statusPages ?? {}))
    if (page) statusFiles.set(page.module, `${code}.html`)

  for (const { path, page } of routes) {
    if (!page.prerender) continue

    if (page.noStore) {
      errors.push(
        `Remove "prerender" or "noStore" from "${path}" as they cannot be used together...`
      )
      continue
    }

    if ((middlewares?.[path] ?? []).length > 0) {
      errors.push(`Remove "prerender" from "${path}" as "+middleware.ts" guards it...`)
      continue
    }

    try {
      staticRoutes.push({
        paths: await toStaticPaths({ path, page }),
        statusFile: statusFiles.get(page)
      })
    } catch (error) {
      errors.push(toMessage(error))
    }
  }

  /** @remarks Check "+error" here as it is not in routes. */
  if (typeof statusFallback?.module.prerender === 'function')
    errors.push('Set "prerender" to true as "+error" has no parameters...')

  return { staticRoutes, errors }
}
