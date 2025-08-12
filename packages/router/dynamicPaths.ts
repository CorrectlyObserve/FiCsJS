import { browserError } from '../core/helpers'

export const dynamicPathToRegex = (path: string): RegExp => {
  const common: string = '/([^/]+?)'
  const pattern: string = path.replace(dynamicRegex, (_1, _2, optional) =>
    optional ? `(?:${common})?` : common
  )
  return new RegExp(`^${pattern}/?$`)
}

export const dynamicRegex: RegExp = /\/:([^\/?]+)(\?)?/g

export const getDynamicPaths = (path: string): Record<string, string> => {
  browserError()

  const regexes: string[] | null = dynamicPathToRegex(path).exec(window.location.pathname),
    paths: Record<string, string> = {},
    names: string[] = []
  let match: RegExpExecArray | null

  dynamicRegex.lastIndex = 0
  while ((match = dynamicRegex.exec(path))) names.push(match[1])

  if (regexes && regexes.length > 0)
    for (const [index, value] of regexes.slice(1).entries()) paths[names[index]] = value ?? ''
  else if (names.length > 0) for (const name of names) paths[name] = ''

  return paths
}
