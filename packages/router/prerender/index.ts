import { writeIfChanged } from '../file'
import { indent, joinLines } from '../helpers'
import { createPageHandler } from '../pages'
import type { Routing } from '../types'
import { findStaticRoutes } from './finder'
import { toFullPath } from './paths'
import { renderStaticRoutes } from './renderer'
import { buildSitemap } from './sitemap'
import { join } from 'node:path'

const throwErrorIfAny = (errors: string[]): void => {
  if (errors.length > 0)
    throw new Error(
      joinLines([
        'The following errors occurred during prerendering:',
        ...errors.map(error => `${indent()}- ${error}`)
      ])
    )
}

export const prerender = async <C extends Record<string, unknown>>(
  manifest: Routing.Options.PageManifest<C>,
  { outDir, origin, sitemap, ...host }: Routing.Options.Prerender<C>
): Promise<string[]> => {
  const { staticRoutes, errors: configErrors }: Routing.Prerender.Found =
    await findStaticRoutes(manifest)

  if (sitemap && origin === undefined)
    configErrors.push('Set "origin", as "sitemap" needs absolute URLs...')

  throwErrorIfAny(configErrors)

  const handler: (req: Request) => Promise<Response> = createPageHandler(manifest, host),
    {
      files,
      sitemapPaths,
      errors: renderErrors
    }: Routing.Prerender.Rendered = await renderStaticRoutes({
      manifest,
      staticRoutes,
      request: (path: string) =>
        handler(new Request(toFullPath({ origin: origin ?? 'http://localhost', path }))),
      outDir
    })

  throwErrorIfAny(renderErrors)

  if (sitemap && origin !== undefined && sitemapPaths.length > 0)
    files.push({
      path: join(outDir, 'sitemap.xml'),
      content: buildSitemap({ origin, paths: sitemapPaths })
    })

  for (const file of files) writeIfChanged(file)
  return files.map(({ path }) => path)
}
