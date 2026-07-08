import type { Routing } from '../../types'
import { fileNames } from '../constants'
import { getFiles } from '../helpers'
import { findClosestDir } from './find'
import { type LayoutContext, type RouteEntry } from './types'

export const buildLayoutContext = ({
  routes,
  filePaths,
  extensions
}: {
  routes: RouteEntry[]
  filePaths: string[]
  extensions: Routing.Extensions
}): LayoutContext => {
  const layoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions
    }),
    layouts: (string | null)[] = routes.map(
      ({ source }) => findClosestDir(source, layoutFiles)?.value ?? null
    ),
    uniqueLayouts: string[] = [
      ...new Set(layouts.filter((layout): layout is string => layout !== null))
    ]

  return {
    layouts,
    uniqueLayouts,
    layoutAliases: new Map(uniqueLayouts.map((layout, index) => [layout, `__layout${index}`]))
  }
}
