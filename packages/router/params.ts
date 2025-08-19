import { isBrowser } from '../core/helpers'
import type { ParamType } from './types'

class Params {
  #isBrowser: boolean = isBrowser()
  #dynamicPaths: Record<string, string> = {}
  #queries: Record<string, string> = {}

  constructor() {
    if (this.#isBrowser) this.#queries = getQueries()
  }

  set(type: ParamType, value: Record<string, string>): void {
    if (!this.#isBrowser)
      throw new Error('Params can only be accessed in the browser environment...')

    if (type === 'dynamicPaths') this.#dynamicPaths = value
    else this.#queries = value
  }

  get(type: ParamType): Record<string, string> {
    if (!this.#isBrowser)
      throw new Error('Params can only be accessed in the browser environment...')

    return type === 'dynamicPaths' ? this.#dynamicPaths : this.#queries
  }
}

export const getQueries = (): Record<string, string> =>
  isBrowser() ? Object.fromEntries(new URLSearchParams(window.location.search)) : {}

export const dynamicPaths = (): Record<string, string> => params.get('dynamicPaths')

export const params: Params = new Params()

export const queries = (): Record<string, string> => params.get('queries')
