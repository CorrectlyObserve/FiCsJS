import { isEmptyObject } from './helpers'
import type { SetTimeout, WebSocket as WebSocketNS } from './types'

export default <D extends object, P>({
  options,
  getDataProps,
  setWebSocketProp
}: WebSocketNS.Ctx.Fn<D, P>): WebSocketNS.Runtime | undefined => {
  if (!options || isEmptyObject(options)) return undefined

  let reconnectedCount: number = 0,
    reconnectedTimer: SetTimeout | null = null,
    activeWebsocket: WebSocket | null = null,
    isManuallyClosed: boolean = false

  const {
      path,
      protocols,
      reconnect,
      onopen,
      onmessage,
      onerror,
      onclose
    }: WebSocketNS.Options<D, P> = options,
    { protocol, host }: { protocol: string; host: string } = window.location,
    clearReconnectTimer = (): void => {
      if (reconnectedTimer) {
        clearTimeout(reconnectedTimer)
        reconnectedTimer = null
      }
    }

  const connect = (): void => {
    const wsUrl: URL = new URL(path, `${protocol}//${host}`)
    wsUrl.protocol = protocol.startsWith('https') ? 'wss:' : 'ws:'

    const websocket: WebSocket = new WebSocket(wsUrl.toString(), protocols),
      isStale = (): boolean => activeWebsocket !== websocket,
      getParams: () => Omit<WebSocketNS.Ctx.Params<D, P>, 'event'> = () => ({
        ...getDataProps(true),
        websocket: {
          send: websocket.send.bind(websocket),
          readyState: () => websocket.readyState,
          bufferedAmount: () => websocket.bufferedAmount,
          binaryType: () => websocket.binaryType,
          url: () => websocket.url,
          protocol: () => websocket.protocol,
          extensions: () => websocket.extensions
        }
      })

    setWebSocketProp({
      send: websocket.send.bind(websocket),
      isOpened: () => websocket.readyState === WebSocket.OPEN
    })

    websocket.onopen = (event: Event): void => {
      if (isStale()) return

      reconnectedCount = 0
      clearReconnectTimer()
      onopen?.({ ...getParams(), event })
    }

    websocket.onmessage = (event: MessageEvent): void => {
      if (isStale()) return
      onmessage?.({ ...getParams(), event })
    }

    const autoReconnect = (): void => {
      if (!isManuallyClosed && reconnect && !reconnectedTimer) {
        const {
          interval,
          max,
          isExponential
        }: NonNullable<WebSocketNS.Options<D, P>>['reconnect'] = reconnect

        if ((max && reconnectedCount < max) || !max)
          reconnectedTimer = setTimeout(
            () => {
              reconnectedTimer = null
              reconnectedCount++
              connect()
            },
            interval * (isExponential ? 2 ** reconnectedCount : 1)
          )
      }
    }

    websocket.onerror = (event: Event): void => {
      if (isStale()) return

      onerror?.({ ...getParams(), event })
      autoReconnect()
    }
    websocket.onclose = (event: CloseEvent): void => {
      if (isStale()) return

      activeWebsocket = null
      setWebSocketProp(undefined)
      onclose?.({ ...getParams(), event })
      autoReconnect()
    }

    activeWebsocket = websocket
  }

  connect()

  return {
    close: (): void => {
      isManuallyClosed = true
      clearReconnectTimer()
      activeWebsocket?.close()
    }
  }
}
