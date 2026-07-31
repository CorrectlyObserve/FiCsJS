export const APPLICATION_JSON = 'application/json' as const
export const CONTENT_TYPE = 'content-type' as const

export const constants = {
  INTERVAL_MS: 1_000,
  JITTER_RATIO: 0.3,
  MAX_DELAY_MS: 30_000,
  MAX_RETRIES: 3,
  statusCode: {
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    NO_CONTENT: 204,
    REQUEST_TIMEOUT: 408,
    TOO_MANY_REQUESTS: 429
  }
} as const

export const NOOP: () => void = () => {}

export const SPECIAL_CHAR: RegExp = /[.*+?^${}()|[\]\\]/g
