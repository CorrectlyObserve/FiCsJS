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

export const fillDynamicPath = (pattern: string, params: Record<string, string>): string | null => {
  let filled: string = '',
    lastIndex: number = 0

  for (const { 0: fullMatched, 1: paramName, 2: flag, index } of pattern.matchAll(dynamicRegex)) {
    const staticPart: string = pattern.slice(lastIndex, index),
      value: string | undefined = params[paramName],
      isOptional: boolean = flag === '?',
      isCatchAll: boolean = flag === '*'

    lastIndex = index + fullMatched.length

    if (isOptional && !value) {
      filled += staticPart
      continue
    }

    const isMissing: boolean = value === undefined || (value === '' && !isCatchAll)

    if (isMissing) return null

    /** @remarks Preserves slashes, as a catch-all ('*') may contain them (e.g., "foo/bar"). */
    const encoded: string = isCatchAll
      ? value.split('/').map(encodeURIComponent).join('/')
      : encodeURIComponent(value)

    filled += `${staticPart}/${encoded}`
  }

  /** @remarks Returns the filled path or the root ("/") if nothing is filled. */
  return `${filled}${pattern.slice(lastIndex)}` || '/'
}

export const getDynamicParams = (pattern: string, pathname: string): Record<string, string> => {
  pattern = prependSlash(pattern)
  pathname = prependSlash(pathname)

  const regexes: RegExpExecArray | null = dynamicPathToRegex(pattern).exec(pathname),
    paths: Record<string, string> = {},
    names: string[] = [...pattern.matchAll(dynamicRegex)].map(({ 1: paramName }) => paramName)

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
