export default (pattern: string, path: string): Map<string, string> => {
  const customParam: RegExp = /\/:[^\/]+/g
  const optional: RegExp = /\?$/
  const regExp: string = pattern.replaceAll(
    customParam,
    (str: string) => `\/([^/]+?)${optional.test(str) ? '?' : ''}`
  )
  const params: string[] = new RegExp(`^${regExp}/?$`).exec(path)?.slice(1) ?? []
  const paramMap: Map<string, string> = new Map()

  if (params.length > 0) {
    const names: string[] = (pattern.match(customParam) ?? []).map(param =>
      param.replace(optional, '').replace(/^\/:/, '')
    )

    if (names.length > 0)
      for (const [index, value] of params.entries()) paramMap.set(names[index], value ?? '')
  }

  return paramMap
}
