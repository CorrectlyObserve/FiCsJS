import type { Routing } from './../../types'
import { fileNames } from './../constants'
import { getFiles } from './../helpers'
import { findClosestDir } from './find'

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
