import type { Query } from '../types'
import { QueryCache } from './cache'

const queryCacheClosure = (() => {
  let currentCache: QueryCache | null = null,
    isLocked: boolean = false

  const createQueryCache = (config?: Partial<Query.Config.Global>): QueryCache =>
    new QueryCache(config)

  return {
    configQueryCache: (config?: Partial<Query.Config.Global>): void => {
      if (isLocked)
        throw new Error(
          'The configQueryCache function must be called before any FiCsElement is described in the browser...'
        )

      currentCache?.destroy()
      currentCache = createQueryCache(config)
    },
    createQueryCache,
    getQueryCache: (): QueryCache => (currentCache ??= createQueryCache()),
    lockQueryCache: (): void => {
      if (!isLocked) isLocked = true
    }
  }
})()

export const { configQueryCache, createQueryCache, getQueryCache, lockQueryCache } =
  queryCacheClosure

export type { QueryCache }
