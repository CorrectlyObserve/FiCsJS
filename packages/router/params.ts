import { browserError, isBrowser } from '../core/helpers'
import type { Param } from './types'

const pathParam: RegExp = /\/:[^\/]+/g

export const getRegExp = (path: string): RegExp =>
  new RegExp(`^${path.replaceAll(pathParam, `\/([^/]+?)`)}\/?$`)

export const getPathParams = (path: string): Record<string, string> => {
  browserError()

  const regExps: string[] | null = getRegExp(path).exec(window.location.pathname),
    pathParams: Record<string, string> = {}

  if (regExps && regExps.length > 0) {
    const names: string[] = (path.match(pathParam) ?? []).map(param => param.replace(/^\/:/, ''))

    if (names.length > 0)
      for (const [index, value] of regExps.slice(1).entries())
        pathParams[names[index]] = value ?? ''
  }

  return pathParams
}

export const isPathParam = (path: string): boolean => pathParam.test(path)

class Params {
  params: Record<Param, Record<string, string>> = { path: {}, query: {} }
  #isBrowser: boolean = isBrowser()

  constructor() {
    if (this.#isBrowser) {
      const { search }: { search: string } = window.location
      this.params.query = Object.fromEntries(new URLSearchParams(search))
    }
  }

  set(param: Param, params: Record<string, string>): void {
    this.params[param] = this.#isBrowser ? params : {}
  }

  get(param: Param): Record<string, string> {
    return this.#isBrowser ? this.params[param] : {}
  }
}

export const params: Params = new Params()
export const getParams = (param: Param): Record<string, string> => params.get(param)
