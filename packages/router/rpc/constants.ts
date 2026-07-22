import { statusCodes } from '../constants'
import { Rpc } from '../types'

export const CONTENT_LENGTH = 'content-length' as const

export const metricReasons = {
  NOT_FOUND: 'not-found',
  BAD_REQUEST: 'bad-request',
  PAYLOAD_TOO_LARGE: 'payload-too-large'
} as const satisfies Record<string, Extract<Rpc.Metric.Payload, { type: 'reject' }>['reason']>

export const DEFAULT_ERRORS: Partial<Record<keyof typeof statusCodes, string>> = {
  BAD_REQUEST: 'The request is invalid or malformed...',
  PAYLOAD_TOO_LARGE: 'The request body is too large...',
  INTERNAL_SERVER_ERROR: 'The server encountered an unexpected error...'
} as const

export const RESERVED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor'])

export const RPC_INPUT_PARAM = 'input' as const
