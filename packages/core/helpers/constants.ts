export default {
  BASE_MS: 1_000,
  JITTER_RATIO: 0.3,
  MAX_MS: 30_000,
  statusCode: {
    CLIENT_ERROR: 400,
    REQUEST_TIMEOUT: 408,
    SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429
  }
} as const
