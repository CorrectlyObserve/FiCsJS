import { normalizePath } from '../../../core/helpers'
import { isDynamicPath } from '../../helpers'
import type { Routing } from '../../types'
import { fileNames } from '../constants'
import { buildRoute, cleanPath, isValidFileType } from '../helpers'

const rankOf = (route: string): number => (route.includes('*') ? 2 : isDynamicPath(route) ? 1 : 0)

export const compareRoutes = (
  { path: targetPath }: Routing.RouteEntry,
  { path: comparedPath }: Routing.RouteEntry
): number => {
  const rankDiff: number = rankOf(targetPath) - rankOf(comparedPath)
  if (rankDiff !== 0) return rankDiff

  const depthDiff: number = comparedPath.split('/').length - targetPath.split('/').length
  if (depthDiff !== 0) return depthDiff

  return targetPath < comparedPath ? -1 : targetPath > comparedPath ? 1 : 0
}

export const toEntry = (path: string): string => {
  const sanitized: string = path.replace(/[:*?]/g, ''),
    entry: string = sanitized.split('/').filter(Boolean).join('-')

  return entry || 'index'
}

export const toRoute = (filePath: string, extensions: Routing.Extensions): string | null => {
  const segments: string[] = cleanPath(filePath).split('/')

  if (!isValidFileType({ file: segments.at(-1) ?? '', expectedType: fileNames.PAGE, extensions }))
    return null

  const route: string = buildRoute(segments.slice(0, -1).filter(segment => segment !== 'index'))
  return normalizePath(`/${route}`)
}
