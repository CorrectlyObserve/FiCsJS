import { isBlankObject } from './helpers'
import type { ActionOptions, DataProps, DebounceThrottle, GetDP, Options, SSEMethod } from './types'

interface Ctx<D extends object, P extends object> extends DebounceThrottle {
  sseOptions: Options<D, P>['sse']
  getDataProps: GetDP<D, P>
}

export const openEventSource = <D extends object, P extends object>({
  sseOptions,
  getDataProps,
  debounce,
  throttle
}: Ctx<D, P>): { eventSource: EventSource; removeEventListeners: () => void } | undefined => {
  if (!sseOptions || isBlankObject(sseOptions)) return undefined

  const { path, withCredentials, onopen, onmessage, onerror, actions }: Options<D, P>['sse'] =
      sseOptions,
    eventSource: EventSource = new EventSource(path, { withCredentials }),
    listeners: { handler: string; callback: (event: MessageEvent) => void }[] = [],
    removeEventListeners = () => {
      for (const { handler, callback } of listeners)
        eventSource.removeEventListener(handler, callback)
    },
    getCtx = (): DataProps<D, P, true> & { close: () => void } => ({
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
    method: SSEMethod<D, P>,
    options?: ActionOptions
  ): void => {
    const { debounce: debounceTime, throttle: throttleTime, once }: ActionOptions = options ?? {}

    if (debounceTime && throttleTime)
      throw new Error('Both "debounce" and "throttle" options cannot be used at the same time...')

    let callback: (event: MessageEvent) => void = (event: MessageEvent): void =>
      method({ ...getCtx(), event })

    if (debounceTime) callback = debounce(callback, debounceTime)
    else if (throttleTime) callback = throttle(callback, throttleTime)

    eventSource.addEventListener(handler, callback, { once })
    listeners.push({ handler, callback })
  }

  for (const [handler, method] of Object.entries(actions))
    Array.isArray(method)
      ? addEventListener(handler, method[0], method[1])
      : addEventListener(handler, method)

  return { eventSource, removeEventListeners }
}
