import { throwWindowError } from '../core/helpers'

export default (path: string): Record<string, string> => {
  throwWindowError()

  const param: RegExp = /\/:[^\/]+/g
  const getRegExp = (path: string): RegExp =>
    new RegExp(`^${path.replaceAll(param, `\/([^/]+?)`)}\/?$`)

  const regExps: string[] | null = getRegExp(path).exec(window.location.pathname)
  const pathParams: Record<string, string> = {}

  if (regExps && regExps.length > 0) {
    const names: string[] = (path.match(param) ?? []).map(param => param.replace(/^\/:/, ''))

    if (names.length > 0)
      for (const [index, value] of regExps.slice(1).entries())
        pathParams[names[index]] = value ?? ''
  }

  return pathParams
}
