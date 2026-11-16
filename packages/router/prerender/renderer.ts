import { statusCodes } from '../constants'
import { isStatusOk, toMessage } from '../helpers'
import type { Routing } from '../types'
import { toFilePath } from './paths'
import { join } from 'node:path'

export const renderStaticRoutes = async <C extends Record<string, unknown>>({
  manifest: { statusPages, statusFallback },
  staticRoutes,
  request,
  outDir
}: {
  manifest: Routing.Options.PageManifest<C>
  staticRoutes: Routing.Prerender.StaticRoutes
  request: (path: string) => Promise<Response>
  outDir: string
}): Promise<Routing.Prerender.Rendered> => {
  const files: Routing.Prerender.Rendered['files'] = [],
    sitemapPaths: string[] = [],
    errors: string[] = []

  for (const { paths, statusFile } of staticRoutes)
    for (const path of paths) {
      let res: Response

      /** @remarks Collects errors instead of throwing immediately to report all failing paths at once. */
      try {
        res = await request(path)
      } catch (error) {
        errors.push(`"${path}" threw ${toMessage(error)}...`)
        continue
      }

      const isStatusPage: boolean = statusFile !== undefined

      if (!isStatusOk(res.status) && !isStatusPage) {
        errors.push(`"${path}" responded ${res.status}, but prerendering needs 200...`)
        continue
      }

      const content: string = await res.text()

      files.push({ path: join(outDir, toFilePath(path)), content })

      if (isStatusPage) files.push({ path: join(outDir, statusFile!), content })
      else sitemapPaths.push(path)
    }

  const { NOT_FOUND } = statusCodes

  /** @remarks Generates "404.html" using the global "+error" fallback by requesting an unknown "/404" path. */
  if (!statusPages?.[NOT_FOUND] && statusFallback?.module.prerender === true) {
    const res: Response = await request(`/${NOT_FOUND}`)

    if (res.status === NOT_FOUND)
      files.push({ path: join(outDir, `${NOT_FOUND}.html`), content: await res.text() })
  }

  return { files, sitemapPaths, errors }
}
