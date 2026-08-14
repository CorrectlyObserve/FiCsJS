import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NO_CONTENT,
  REQUEST_TIMEOUT,
  TOO_MANY_REQUESTS
} from '../core/helpers'

export const FICS_META = 'fics:meta' as const
export const FICS_NAVIGATE = 'fics:navigate' as const
export const ROUTER_COMPONENT_NAME = '_router' as const
export const RPC_BASE = '/_rpc' as const

export const RPC_MODULE_TYPE = { module: 'rpc' } as const

export const statusCodes = {
  BAD_REQUEST,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED: 405,
  NO_CONTENT,
  NOT_FOUND: 404,
  OK: 200,
  PAYLOAD_TOO_LARGE: 413,
  REDIRECT: 302,
  REQUEST_TIMEOUT,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED: 401
} as const
