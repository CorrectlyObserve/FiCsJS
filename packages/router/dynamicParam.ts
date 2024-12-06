export const pathParam: RegExp = /\/:[^\/]+/g

export const getRegExp = (path: string): RegExp =>
  new RegExp(`^${path.replaceAll(pathParam, `\/([^/]+?)`)}\/?$`)
