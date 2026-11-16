import { normalizePath } from '../core/helpers'
import { dynamicPathToRegex } from './dynamicPaths'
import { isDynamicPath } from './helpers'

/**
 * @remarks
 * Evaluates whether the SPA should intercept the navigation, keeping unknown paths in-app to render a 404.
 */
export const canNavigate = ({
  href,
  currentHref,
  basePath,
  ownPaths,
  appPaths = [],
  redirects
}: {
  href: string
  currentHref: string
  basePath: string
  ownPaths: readonly string[]
  appPaths?: readonly string[]
  redirects?: ReadonlyMap<string, string>
}): boolean => {
  const { origin, pathname }: URL = new URL(href, currentHref),
    isExternalDomain: boolean = origin !== new URL(currentHref).origin

  if (isExternalDomain) return false

  const normalizedPath: string = normalizePath(pathname),
    hasExtension: boolean = /\/[^/]*\.[^/]+$/.test(normalizedPath)

  if (hasExtension) return false
  if (redirects?.has(normalizedPath)) return true

  const matchesStatic = (paths: readonly string[]): boolean =>
      paths.some(path => !isDynamicPath(path) && normalizePath(path) === normalizedPath),
    matchesDynamic = (paths: readonly string[]): boolean =>
      paths.some(path => isDynamicPath(path) && dynamicPathToRegex(path).test(normalizedPath))

  for (const matches of [matchesStatic, matchesDynamic]) {
    if (matches(ownPaths)) return true
    if (matches(appPaths)) return false
  }

  const normalizedBasePath: string = normalizePath(basePath),
    isGlobalRoot: boolean = normalizedBasePath === '/',
    isBaseRoot: boolean = normalizedPath === normalizedBasePath,
    isSubPath: boolean = normalizedPath.startsWith(`${normalizedBasePath}/`)

  return isGlobalRoot || isBaseRoot || isSubPath
}
