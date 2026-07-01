export const FICS_NAVIGATE = 'fics:navigate' as const

export const RPC_BASE_PATH = '/_rpc' as const
export const RPC_MODULE_TYPE = { module: 'rpc' } as const

export const statusCodes = {
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  REDIRECT: 302
} as const
