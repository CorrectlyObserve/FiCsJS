export const isBlankString = (param: unknown): boolean =>
  typeof param === 'string' && param.trim() === ''

export const isEmptyObject = (param: unknown): boolean =>
  isPlainObject(param) && Reflect.ownKeys(param).length === 0

export const isObject = (param: unknown): param is object =>
  typeof param === 'object' && param !== null

export const isPlainObject = (param: unknown): param is Record<string, unknown> => {
  if (!isObject(param) || Array.isArray(param)) return false

  const proto: object | null = Object.getPrototypeOf(param)
  return proto === Object.prototype || proto === null
}
