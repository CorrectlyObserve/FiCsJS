import { normalizePath, toLowerFirst } from '../../../core/helpers'
import { isDynamicPath } from '../../helpers'
import type { Routing } from '../../types'
import { fileNames } from '../constants'
import { buildRoute, cleanPath, isValidFileType, toPascal } from '../helpers'

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

export const toDirRoute = (dirs: string[]): string =>
  normalizePath(`/${buildRoute(dirs.filter(segment => segment !== 'index'))}`)

export const toEntry = (path: string): string => {
  const sanitized: string = path.replace(/[:*?]/g, ''),
    entry: string = sanitized.split('/').filter(Boolean).join('-')

  return entry || 'index'
}

export const toRoute = (filePath: string, extensions: Routing.Extensions): string | null => {
  const segments: string[] = cleanPath(filePath).split('/')

  const file: string = segments.at(-1) ?? '',
    isPage: boolean = [fileNames.PAGE, fileNames.PAGE_SERVER].some(expectedType =>
      isValidFileType({ file, expectedType, extensions })
    )

  return isPage ? toDirRoute(segments.slice(0, -1)) : null
}

export const toSpaAlias = (dir: string, role: 'Spa' | 'SpaServer'): string =>
  `__${toLowerFirst(`${toPascal(dir)}${role}`)}`
