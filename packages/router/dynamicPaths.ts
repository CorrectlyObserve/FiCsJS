import { escapeRegExp } from '../core/helpers'
import { prependSlash } from './helpers'

export const dynamicPathToRegex = (pattern: string): RegExp => {
  pattern = prependSlash(pattern)

  const required = '/([^/]+?)' as const,
    segments: Readonly<Record<string, string>> = {
      '*': '/(.*?)',
      '?': `(?:${required})?`,
      '': required
    }

  let source: string = '',
    lastIndex: number = 0

  for (const { 0: fullMatched, 2: flag = '', index } of pattern.matchAll(dynamicRegex)) {
    source += `${escapeRegExp(pattern.slice(lastIndex, index))}${segments[flag]}`
    lastIndex = index + fullMatched.length
  }
  source += escapeRegExp(pattern.slice(lastIndex))

  return new RegExp(`^${source}/?$`)
}

export const dynamicRegex: RegExp = /\/:([^\/?*]+)(\?|\*)?/g

export const getDynamicParams = (pattern: string, pathname: string): Record<string, string> => {
  pattern = prependSlash(pattern)
  pathname = prependSlash(pathname)

  const regexes: RegExpExecArray | null = dynamicPathToRegex(pattern).exec(pathname),
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
