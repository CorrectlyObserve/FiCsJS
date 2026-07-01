export const FICS_NAVIGATE = 'fics:navigate' as const

export const RPC_BASE_PATH = '/_rpc' as const
export const RPC_MODULE_TYPE = { module: 'rpc' } as const

export const statusCodes = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  OK: 200,
  PAYLOAD_TOO_LARGE: 413,
  REDIRECT: 302
} as const
