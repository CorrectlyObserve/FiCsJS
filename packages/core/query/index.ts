import type { Query } from '../types'
import QueryCache from './cache'
import syncQueryCache from './runtime'

const createQueryCache = <T>(config?: Query.Config.Global): QueryCache<T> => new QueryCache(config)

export { createQueryCache, syncQueryCache }
export type { QueryCache }
