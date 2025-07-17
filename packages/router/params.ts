import { isBrowser } from '../core/helpers'
import type { Param } from './types'

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
