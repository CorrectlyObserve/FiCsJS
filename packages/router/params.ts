import { isBrowser } from '../core/helpers'
import type { ParamType } from './types'

class Params {
  #isBrowser: boolean = isBrowser()
  #dynamicPaths: Record<string, string> = {}
  #queries: Record<string, string> = {}

  constructor() {
    if (this.#isBrowser) this.#queries = searchParams(window.location.search)
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

export const searchParams = (url: string): Record<string, string> =>
  Object.fromEntries(new URLSearchParams(url))

export const params: Params = new Params()

export const dynamicPaths = (): Record<string, string> => params.get('dynamicPaths')

export const queries = (): Record<string, string> => params.get('queries')
