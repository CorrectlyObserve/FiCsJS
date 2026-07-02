import { browserError } from '../core/helpers'

export const dynamicPathToRegex = (path: string): RegExp => {
  if (!path.startsWith('/')) path = `/${path}`

  const escapeRegex = (param: string): string => param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    required = '/([^/]+?)' as const,
    caughtAll = '/(.*?)' as const

  let match: RegExpExecArray | null,
    pattern: string = '',
    lastIndex: number = 0

  dynamicRegex.lastIndex = 0

  while ((match = dynamicRegex.exec(path))) {
    const staticPart: string = path.slice(lastIndex, match.index),
      flag: string | undefined = match[2],
      segment: string = flag === '*' ? caughtAll : flag === '?' ? `(?:${required})?` : required

    pattern += `${escapeRegex(staticPart)}${segment}`

    lastIndex = match.index + match[0].length
  }
  pattern += escapeRegex(path.slice(lastIndex))

  return new RegExp(`^${pattern}/?$`)
}

export const dynamicRegex: RegExp = /\/:([^\/?*]+)(\?|\*)?/g

export const getDynamicPaths = (pattern: string, pathname?: string): Record<string, string> => {
  if (pathname === undefined) browserError()

  const regexes: RegExpExecArray | null = dynamicPathToRegex(pattern).exec(
      pathname ?? window.location.pathname
    ),
    paths: Record<string, string> = {},
    names: string[] = []
  let match: RegExpExecArray | null

  dynamicRegex.lastIndex = 0
  while ((match = dynamicRegex.exec(pattern))) names.push(match[1])

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
