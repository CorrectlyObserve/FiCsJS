import { browserError } from '../core/helpers'

const dynamicPath: RegExp = /\/:[^\/]+(\?)?/g

export const dynamicPathToRegExp = (path: string): RegExp => {
  const common: string = '/([^/]+?)'
  const pattern: string = path.replace(dynamicPath, (_1, _2, optional) =>
    optional ? `(?:${common})?` : common
  )
  return new RegExp(`^${pattern}/?$`)
}

export const dynamicPathParams = (path: string): Record<string, string> => {
  browserError()

  const regExps: string[] | null = dynamicPathToRegExp(path).exec(window.location.pathname),
    pathParams: Record<string, string> = {}

  if (regExps && regExps.length > 0) {
    const names: string[] = (path.match(dynamicPath) ?? []).map(param => param.replace(/^\/:/, ''))

    if (names.length > 0)
      for (const [index, value] of regExps.slice(1).entries())
        pathParams[names[index]] = value ?? ''
  }

  return pathParams
}

export const hasDynamicPaths = (path: string): boolean => dynamicPath.test(path)
