import { isBrowser } from '../helpers'
import type { Query } from '../types'
import QueryCache from './cache'

let currentCache: QueryCache<unknown> | null = null,
  isLocked: boolean = false

const configQueryCache = (config?: Query.Config.Global): void => {
    if (isLocked)
      throw new Error(
        'The configQueryCache function must be called before any FiCsElement is described in the browser...'
      )
    currentCache?.destroy()
    currentCache = new QueryCache<unknown>(config)
  },
  getQueryCache = (): QueryCache<unknown> => {
    if (isBrowser()) isLocked = true
    return (currentCache ??= new QueryCache<unknown>())
  }

export { configQueryCache, getQueryCache, syncQueryCache }
export type { QueryCache }
