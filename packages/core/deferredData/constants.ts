export const DEFERRED_DATA_LOAD_KEY = 'deferredDataLoad' as const

export const IGNORED_DEFERRED_KEYS: ReadonlySet<string> = new Set(['toJSON', 'then'])
