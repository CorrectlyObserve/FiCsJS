export default (path: string, pathname: string): Record<string, string> => {
  const customParam: RegExp = /\/:[^\/]+/g
  const optional: RegExp = /\?$/
  const regExp: string = path.replaceAll(
    customParam,
    (str: string) => `\/([^/]+?)${optional.test(str) ? '?' : ''}`
  )
  const regExps: string[] | null = new RegExp(`^${regExp}/?$`).exec(pathname)
  const params: Record<string, string> = {}

  if (regExps && regExps.length > 0) {
    const names: string[] = (path.match(customParam) ?? []).map(param =>
      param.replace(optional, '').replace(/^\/:/, '')
    )

    if (names.length > 0)
      for (const [index, value] of regExps.slice(1).entries()) params[names[index]] = value ?? ''
  }

  return params
}
