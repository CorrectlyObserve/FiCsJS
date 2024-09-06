export default (path: string): Record<string, string> => {
  if (!window) throw new Error('window is not defined...')

  const pathParam: RegExp = /\/:[^\/]+/g
  const regExps: string[] | null = new RegExp(
    `^${path.replaceAll(pathParam, `\/([^/]+?)`)}/?$`
  ).exec(window.location.pathname)
  const pathParams: Record<string, string> = {}

  if (regExps && regExps.length > 0) {
    const names: string[] = (path.match(pathParam) ?? []).map(param => param.replace(/^\/:/, ''))

    if (names.length > 0)
      for (const [index, value] of regExps.slice(1).entries())
        pathParams[names[index]] = value ?? ''
  }

  return pathParams
}
