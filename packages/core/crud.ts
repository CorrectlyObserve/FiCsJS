import { numberError } from './helpers'
import type { Crud, SetTimeout } from './types'

/**
 * @param options.timeoutMs Must be a non-negative integer if it is a number.
 * @param options.intervalMs Must be a non-negative integer if it is a number.
 * @param options.maxRetries Must be a non-negative integer if it is a number.
 */
export default async <T>({
  endpoint,
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

  numberError({ timeoutMs, intervalMs }, 'non-negative-int')

  const method: string = args.method?.toUpperCase() ?? 'GET'

  if (onChunk && method !== 'GET')
    throw new Error('The stream option is only available for GET requests...')

  if (method === 'HEAD') throw new Error('The HEAD method is not supported in the crud function...')

  const handleRes = async (): Promise<T | void> => {
    const res: Response = await (async () => {
      let attempt: number = 0

      while (true) {
        const controller: AbortController = new AbortController(),
          { signal }: { signal: AbortSignal } = controller
        let timeoutId: SetTimeout | undefined

        if (timeout && timeout > 0) timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const res: Response = await fetch(endpoint, { ..._options, signal })

          if (timeoutId) clearTimeout(timeoutId)
          return res
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId)

          if (signal.aborted)
            throw new Error(
              `The request to "${endpoint}" ${timeout && timeout > 0 ? `timed out after ${timeout}ms` : 'was aborted'}...`
            )

          if (maxRetry && attempt < maxRetry) {
            attempt++
            await new Promise(resolve => setTimeout(resolve, delay ?? 0))
            continue
          }
          throw error
        }
      }
    })()

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: The request failed...`)
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
  await new Promise(resolve => setTimeout(resolve, delay ?? 0))

  try {
    return await handleRes()
  } finally {
    apiStatuses.set(key, false)
    enqueue(() => reRender(true), 're-render')
  }
}
