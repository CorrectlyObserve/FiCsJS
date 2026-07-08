import type { Routing } from './../../types'
import { fileNames } from './../constants'
import { getFiles, toSpecifier } from './../helpers'
import { findClosestDir } from './finder'
import { compareRoutes, toRoute } from './path'

export const buildEntries = ({
  filePaths,
  extensions,
  baseDir
}: Omit<Routing.BuilderQuery, 'routes'> & { baseDir: string }): Routing.RouteEntry[] => {
  const routes: Routing.RouteEntry[] = [],
    seen: Map<string, string> = new Map()

  for (const filePath of filePaths) {
    const path: string | null = toRoute(filePath, extensions)
    if (path === null) continue

    const existing: string | undefined = seen.get(path)
    if (existing)
      throw new Error(
        `The duplicated route "${path}" is defined in both "${existing}" and "${filePath}"...`
      )
    seen.set(path, filePath)
    routes.push({ path, specifier: toSpecifier(filePath, baseDir), src: filePath })
  }

  return routes.sort(compareRoutes)
}

export const buildLayoutCtx = ({
  routes,
  filePaths,
  extensions
}: Routing.BuilderQuery): Routing.Ctx.Layout => {
  const layoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions
    }),
    layouts: Routing.Ctx.Layout['layouts'] = routes.map(
      ({ src }) => findClosestDir(src, layoutFiles)?.value ?? null
    ),
    uniqueLayouts: Routing.Ctx.Layout['uniqueLayouts'] = [
      ...new Set(layouts.filter((layout): layout is string => layout !== null))
    ]

  return {
    layouts,
    uniqueLayouts,
    layoutAliases: new Map(uniqueLayouts.map((layout, index) => [layout, `__layout${index}`]))
  }
}
