import type { SingleOrArray } from './types'

export const convertToArray = <T>(params: SingleOrArray<T>): T[] =>
  Array.isArray(params)
    ? [...params]
    : [params && typeof params === 'object' ? { ...params } : params]
