import { browserError } from '../core/helpers'

export const dynamicPath: RegExp = /\/:([^\/?]+)(\?)?/g

export const dynamicPathToRegExp = (path: string): RegExp => {
  const common: string = '/([^/]+?)'
  const pattern: string = path.replace(dynamicPath, (_1, _2, optional) =>
    optional ? `(?:${common})?` : common
  )
  return new RegExp(`^${pattern}/?$`)
}

export const dynamicPaths = (path: string): Record<string, string> => {
  browserError()

  const regExps: string[] | null = dynamicPathToRegExp(path).exec(window.location.pathname),
    paths: Record<string, string> = {},
    names: string[] = []
  let match: RegExpExecArray | null

  dynamicPath.lastIndex = 0
  while ((match = dynamicPath.exec(path))) names.push(match[1])

  if (regExps && regExps.length > 0)
    for (const [index, value] of regExps.slice(1).entries()) paths[names[index]] = value ?? ''
  else if (names.length > 0) for (const name of names) paths[name] = ''

  return paths
}
