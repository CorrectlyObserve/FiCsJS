import { browserError, escapeRegExp } from '../core/helpers'
import { prependSlash } from './helpers'

export const dynamicPathToRegex = (pattern: string): RegExp => {
  pattern = prependSlash(pattern)

  const required = '/([^/]+?)' as const,
    caughtAll = '/(.*?)' as const

  let source: string = '',
    lastIndex: number = 0

  for (const match of pattern.matchAll(dynamicRegex)) {
    const staticPart: string = pattern.slice(lastIndex, match.index),
      flag: string | undefined = match[2],
      segment: string = flag === '*' ? caughtAll : flag === '?' ? `(?:${required})?` : required

    source += `${escapeRegExp(staticPart)}${segment}`

    lastIndex = match.index + match[0].length
  }
  source += escapeRegExp(pattern.slice(lastIndex))

  return new RegExp(`^${source}/?$`)
}

export const dynamicRegex: RegExp = /\/:([^\/?*]+)(\?|\*)?/g

export const getDynamicPaths = (pattern: string, pathname?: string): Record<string, string> => {
  if (pathname === undefined) browserError()

  pattern = prependSlash(pattern)
  pathname = pathname ? prependSlash(pathname) : window.location.pathname

  const regexes: RegExpExecArray | null = dynamicPathToRegex(pattern).exec(
      pathname ?? window.location.pathname
    ),
    paths: Record<string, string> = {},
    names: string[] = []

  for (const match of pattern.matchAll(dynamicRegex)) names.push(match[1])

  if (regexes && regexes.length > 0)
    for (const [index, value] of regexes.slice(1).entries()) {
      const raw: string = value ?? ''

      try {
        paths[names[index]] = decodeURIComponent(raw)
      } catch (error) {
        console.warn(error)
        paths[names[index]] = raw
      }
    }
  else if (names.length > 0) for (const name of names) paths[name] = ''

  return paths
}
