import { isBrowser } from '../core/helpers'
import type { Param } from './types'

class Params {
  #isBrowser: boolean = isBrowser()
  #params: Record<Param, Record<string, string>> = { dynamicPaths: {}, queries: {} }

  constructor() {
    if (this.#isBrowser) {
      const { search }: { search: string } = window.location
      this.#params.queries = searchParams(search)
    }
  }

  set(type: Param, value: Record<string, string>): void {
    this.#params[type] = this.#isBrowser ? value : {}
  }

  get(type: Param): Record<string, string> {
    return this.#isBrowser ? this.#params[type] : {}
  }
}

export const searchParams = (url: string): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(url))

export const params: Params = new Params()

export const dynamicPaths = (): Record<string, string> => params.get('dynamicPaths')

export const queries = (): Record<string, string> => params.get('queries')
