import { typedEntries } from '../../core/helpers'
import { toMessage } from '../helpers'
import type { Routing } from '../types'
import { toStaticPaths } from './paths'

export const findStaticRoutes = async <C extends Record<string, unknown>>({
  statusPages,
  routes,
  middlewares,
  statusFallback
}: Routing.Options.PageManifest<C>): Promise<{
  staticRoutes: Routing.Prerender.StaticRoutes
  errors: string[]
}> => {
  const staticRoutes: Routing.Prerender.StaticRoutes = [],
    errors: string[] = [],
    /** @remarks Requires "404.html" at the root, not "404/index.html" for static hosts. */
    statusFiles: Map<Routing.ServerModule<C>, string> = new Map()

  for (const [code, page] of typedEntries(statusPages))
    if (page) statusFiles.set(page.module, `${code}.html`)

  for (const { path, page } of routes) {
    if (!page.prerender) continue

    if (page.noStore) {
      errors.push(`Both "prerender" and "noStore" cannot be set in "${path}" at the same time...`)
      continue
    }

    if ((middlewares?.[path] ?? []).length > 0) {
      errors.push(`"prerender" cannot be used in "${path}" as it is guarded by "+middleware.ts"...`)
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

  /** @remarks Skip dynamic paths for "+error" as it is a global fallback without a specific URL. */
  if (typeof statusFallback?.module.prerender === 'function')
    errors.push('Set "prerender" to true as "+error" has no parameters...')

  return { staticRoutes, errors }
}
