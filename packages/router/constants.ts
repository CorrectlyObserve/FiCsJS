import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NO_CONTENT,
  REQUEST_TIMEOUT,
  TOO_MANY_REQUESTS
} from '../core/helpers'

export const denialCodes = {
  CONFLICT: 409,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401
} as const

export const FICS_NAVIGATE = 'fics:navigate' as const
export const FICS_STATUS = 'fics:status' as const
export const LINK_COMPONENT_NAME = '_link' as const

export const RESERVED_ROUTER_DATA_KEYS = ['pathname', 'queries', 'status'] as const

export const ROUTER_COMPONENT_NAME = '_router' as const
export const RPC_BASE = '/_rpc' as const

export const RPC_MODULE_TYPE = { module: 'rpc' } as const

export const STATUS_FALLBACK = 'fallback' as const

export const STATUS_PAGE_META = { robots: 'noindex' } as const

export const statusCodes = {
  ...denialCodes,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED: 405,
  NO_CONTENT,
  OK: 200,
  PAYLOAD_TOO_LARGE: 413,
  REDIRECT: 302,
  REQUEST_TIMEOUT,
  TOO_MANY_REQUESTS
} as const
