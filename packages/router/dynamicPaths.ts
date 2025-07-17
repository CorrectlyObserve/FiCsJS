import { browserError } from '../core/helpers'

const dynamicPath: RegExp = /\/:[^\/]+/g

export const dynamicPathToRegExp = (path: string): RegExp =>
  new RegExp(`^${path.replaceAll(dynamicPath, `\/([^/]+?)`)}\/?$`)

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
