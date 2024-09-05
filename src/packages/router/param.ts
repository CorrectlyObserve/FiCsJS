export default (pattern: string, path: string): Map<string, string> => {
  const param: RegExp = /\/:[^\/]+/g
  const optional: RegExp = /\?$/
  const regExp: string = pattern.replaceAll(
    param,
    (str: string) => `${/\/([^/]+?)/}${optional.test(str) ? '?' : ''}`
  )
  const params: string[] = new RegExp(`^${regExp}/?$`).exec(path)?.slice(1) ?? []
  const paramMap: Map<string, string> = new Map()

  if (params.length > 0) {
    const names: string[] = new Array()

    for (const key of pattern.match(param) ?? [])
      names.push(key.replace(optional, '').replace(/^\/:/, ''))

    if (names.length > 0)
      for (const [index, value] of params.entries()) paramMap.set(names[index], value ?? '')
  }

  return paramMap
}
