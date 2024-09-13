export const getRegExp = (path: string): RegExp =>
  new RegExp(`^${path.replaceAll(pathParam, `\/([^/]+?)`)}\/?$`)

export const pathParam: RegExp = /\/:[^\/]+/g
