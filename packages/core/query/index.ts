import type { Query } from '../types'
import { QueryCache } from './cache'

let currentCache: QueryCache | null = null,
  isLocked: boolean = false

export const configQueryCache = (config?: Partial<Query.Config.Global>): void => {
  if (isLocked)
    throw new Error(
      'The configQueryCache function must be called before any FiCsElement is described in the browser...'
    )

  currentCache?.destroy()
  currentCache = createQueryCache(config)
}

export const createQueryCache = (config?: Partial<Query.Config.Global>): QueryCache =>
  new QueryCache(config)

export const getQueryCache = (): QueryCache => (currentCache ??= createQueryCache())

export const isQueryCacheLocked = (): boolean => isLocked

export const lockQueryCache = (): void => {
  isLocked = true
}

export type { QueryCache }
