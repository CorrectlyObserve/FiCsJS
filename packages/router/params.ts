import { isBrowser } from '../core/helpers'
import CUSTOM_EVENT_NAME from './constants'
import type { ParamType } from './types'

class Params {
  #isBrowser: boolean = isBrowser()
  #dynamicPaths: Record<string, string> = {}
  #queries: Record<string, string> = {}

  constructor() {
    if (!this.#isBrowser) return

    this.#saveQueries()
    window.addEventListener('popstate', this.#saveQueries.bind(this))
    window.addEventListener(CUSTOM_EVENT_NAME, this.#saveQueries.bind(this))
  }

  #saveQueries(): void {
    this.#queries = getQueries()
  }

  set(type: ParamType, value: Record<string, string>): void {
    if (!this.#isBrowser)
      throw new Error('Params can only be accessed in the browser environment...')

    type === 'dynamicPaths' ? (this.#dynamicPaths = { ...value }) : (this.#queries = { ...value })
  }

  get(type: ParamType): Record<string, string> {
    if (!this.#isBrowser)
      throw new Error('Params can only be accessed in the browser environment...')

    return type === 'dynamicPaths' ? { ...this.#dynamicPaths } : { ...this.#queries }
  }
}

export const getQueries = (): Record<string, string> =>
  isBrowser() ? Object.fromEntries(new URLSearchParams(window.location.search)) : {}

export const params: Params = new Params()

export const dynamicPaths = (): Record<string, string> => params.get('dynamicPaths')
export const queries = (): Record<string, string> => params.get('queries')
