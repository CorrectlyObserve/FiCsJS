import { isEmptyObject, typedEntries } from './helpers'
import type { Action, DataProps, SSE } from './types'

export const openEventSource = <D extends object, P>({
  options,
  getDataProps,
  debounce,
  throttle
}: SSE.Ctx<D, P>): { eventSource: EventSource; removeEventListeners: () => void } | undefined => {
  if (!options || isEmptyObject(options)) return undefined

  const { path, withCredentials, onopen, onmessage, onerror, actions }: SSE.Options<D, P> = options,
    eventSource: EventSource = new EventSource(path, { withCredentials }),
    listeners: { handler: string; callback: (event: MessageEvent) => void }[] = [],
    removeEventListeners = () => {
      for (const { handler, callback } of listeners)
        eventSource.removeEventListener(handler, callback)
    },
    getCtx = (): DataProps.Payload<D, P, true> & { close: () => void } => ({
      ...getDataProps(true),
      close: () => {
        removeEventListeners()
        eventSource.close()
      }
    })

  eventSource.onopen = (event: Event): void => onopen?.({ ...getCtx(), event })
  eventSource.onmessage = (event: MessageEvent): void => onmessage?.({ ...getCtx(), event })
  eventSource.onerror = (event: Event): void => onerror?.({ ...getCtx(), event })

  const addEventListener = (
    handler: string,
    method: SSE.Method<D, P>,
    options?: Action.Options
  ): void => {
    const { debounceMs, throttleMs, once }: Action.Options = options ?? {}

    if (debounceMs && throttleMs)
      throw new Error('Both "debounceMs" and "throttleMs" options cannot be used at the same time...')

    let callback: (event: MessageEvent) => void = (event: MessageEvent): void =>
      method({ ...getCtx(), event })

    if (debounceMs) callback = debounce(callback, debounceMs)
    else if (throttleMs) callback = throttle(callback, throttleMs)

    eventSource.addEventListener(handler, callback, { once })
    listeners.push({ handler, callback })
  }

  for (const [handler, method] of typedEntries(actions))
    Array.isArray(method)
      ? addEventListener(handler, method[0], method[1])
      : addEventListener(handler, method)

  return { eventSource, removeEventListeners }
}
