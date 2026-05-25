import { delay, getDelayMs, MAX_RETRIES, numberError, shouldRetry } from './helpers'
import type { Crud, SetTimeout } from './types'

/**
 * @param options.timeoutMs Must be a non-negative integer if it is a number.
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 */
export const crud = async <T>({
  endpoint,
  name,
  apiStatuses,
  enqueue,
  reRender,
  options
}: Crud.Ctx): Promise<T | void> => {
  const {
      key,
      timeoutMs,
      intervalMs,
      maxRetries = MAX_RETRIES,
      signal,
      ...args
    }: Crud.Options = options ?? {},
    { onChunk } = options && 'onChunk' in options ? (options as Crud.StreamOptions) : {}

  numberError({ timeoutMs, intervalMs, maxRetries }, 'non-negative-int')

  const method: string = args.method?.toUpperCase() ?? 'GET'

  if (onChunk && method !== 'GET')
    throw new Error('The stream option is only available for GET requests...')

  if (method === 'HEAD') throw new Error('The HEAD method is not supported in the crud function...')

  const handleRes = async (): Promise<T | void> => {
    let attempt: number = 0

    const fetchOnce = async (): Promise<Response> => {
      const controller: AbortController = new AbortController(),
        cleanups: (() => void)[] = []

      if (signal)
        if (signal.aborted) controller.abort(signal.reason)
        else {
          const onAbort = (): void => controller.abort(signal.reason)

          signal.addEventListener('abort', onAbort, { once: true })
          cleanups.push(() => signal.removeEventListener('abort', onAbort))
        }

      let timer: SetTimeout | undefined
      if (timeoutMs && timeoutMs > 0)
        timer = setTimeout(
          () => controller.abort(new DOMException('Timeout', 'AbortError')),
          timeoutMs
        )

      try {
        const res: Response = await fetch(endpoint, { ...args, signal: controller.signal })
        /** @remarks Forces HTTP errors (4xx/5xx) into the outer catch block for retry evaluation. */
        if (!res.ok) throw res

        return res
      } finally {
        if (timer) clearTimeout(timer)
        for (const cleanup of cleanups) cleanup()
      }
    }
    const res: Response = await (async () => {
      while (true) {
        try {
          return await fetchOnce()
        } catch (error) {
          attempt++

          if (!shouldRetry({ error, attempt, maxRetries, signal }))
            throw new Error(`The ${method} request to "${endpoint}" failed...`, { cause: error })

          try {
            await delay(getDelayMs({ error, attempt, intervalMs }), signal)
          } catch {
            throw error
          }
        }
      }
    })()

    if (res.status === 204) return

    const contentType: string = res.headers.get('content-type')?.toLowerCase() ?? '',
      isJson: boolean = contentType.startsWith('application/json'),
      isEventStream: boolean = contentType.startsWith('text/event-stream'),
      readStream = async (): Promise<void> => {
        const reader: ReadableStreamDefaultReader | undefined = res.body?.getReader()
        if (!reader) throw new Error('The Streams option is not available in this environment...')

        const decoder: TextDecoder = new TextDecoder()
        let index: number = 0

        try {
          while (true) {
            const { done, value }: { done: boolean; value?: Uint8Array } = await reader.read()
            if (done) break

            const chunk: string = decoder.decode(value, { stream: true })
            onChunk?.(chunk, index++)
          }
        } finally {
          reader.releaseLock()
        }
      }

    if (onChunk) {
      if (!isEventStream)
        throw new Error('The Stream API can only be used for text/event-stream responses...')

      return await readStream()
    }

    if (!isJson)
      throw new Error('The response is required to have a content-type of application/json...')

    return (await res.json()) as T
  }

  if (!key) return await handleRes()

  if (apiStatuses.get(key))
    console.warn(`The internal API status key "${key}" is already in progress...`)

  apiStatuses.set(key, true)
  enqueue(() => reRender(true), 're-render')

  try {
    return await handleRes()
  } finally {
    apiStatuses.set(key, false)
    enqueue(() => reRender(true), 're-render')
  }
}
