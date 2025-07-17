import { isBrowser } from '../core/helpers'
import type { Param } from './types'

class Params {
  #isBrowser: boolean = isBrowser()
  #params: Record<Param, Record<string, string>> = { dynamicPaths: {}, queries: {} }

  constructor() {
    if (this.#isBrowser) {
      const { search }: { search: string } = window.location
      this.#params.queries = Object.fromEntries(new URLSearchParams(search))
    }
  }

  set(type: Param, value: Record<string, string>): void {
    this.#params[type] = this.#isBrowser ? value : {}
  }

  get(type: Param): Record<string, string> {
    return this.#isBrowser ? this.#params[type] : {}
  }
}

export const params: Params = new Params()

export const dynamicPathParams = (): Record<string, string> => params.get('dynamicPaths')

export const queryParams = (): Record<string, string> => params.get('queries')
