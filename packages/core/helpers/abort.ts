import { numberError } from './numberError'
import type { SetTimeout } from '../types'
import { NOOP } from './constants'

export const forwardAbort = (controller: AbortController, source: AbortSignal): (() => void) =>
  onAbort(source, () => controller.abort(source.reason))

export const isClientTermination = (error: unknown): boolean =>
  error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')

export const onAbort = (signal: AbortSignal, callback: () => void): (() => void) => {
  if (signal.aborted) {
    callback()
    return NOOP
  }

  signal.addEventListener('abort', callback, { once: true })
  return () => signal.removeEventListener('abort', callback)
}

export const scheduleAbort = ({
  controller,
  timeoutMs,
  message
}: {
  controller: AbortController
  timeoutMs?: number
  message: string
}): (() => void) => {
  numberError({ timeoutMs }, 'int')

  if (!timeoutMs || timeoutMs <= 0) return NOOP

  const timer: SetTimeout = setTimeout(
    () => controller.abort(new DOMException(message, 'TimeoutError')),
    timeoutMs
  )
  return () => clearTimeout(timer)
}
