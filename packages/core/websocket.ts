import { isBlankObject } from './helpers'
import type { SetTimeout, WebSocket as WebSocketNS } from './types'

export default <D extends object, P>({
  options,
  getDataProps,
  setWebSocketProp
}: WebSocketNS.Ctx.Fn<D, P>): WebSocket | undefined => {
  if (!options || isBlankObject(options)) return undefined

  let reconnectedCount: number = 0,
    reconnectedTimer: SetTimeout | null = null

  const {
      path,
      protocols,
      reconnect,
      onopen,
      onmessage,
      onerror,
      onclose
    }: WebSocketNS.Options<D, P> = options,
    { protocol, host }: { protocol: string; host: string } = window.location

  const connect = (): WebSocket => {
    const wsUrl: URL = new URL(path, `${protocol}//${host}`)
    wsUrl.protocol = protocol.startsWith('https') ? 'wss:' : 'ws:'

    const websocket: WebSocket = new WebSocket(wsUrl.toString(), protocols),
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
      reconnectedCount = 0

      if (reconnectedTimer) {
        clearTimeout(reconnectedTimer)
        reconnectedTimer = null
      }

      onopen?.({ ...getParams(), event })
    }

    websocket.onmessage = (event: MessageEvent): void => onmessage?.({ ...getParams(), event })

    const autoReconnect = (): void => {
      if (reconnect && !reconnectedTimer) {
        const {
          interval,
          max,
          isExponential
        }: NonNullable<WebSocketNS.Options<D, P>>['reconnect'] = reconnect

        if ((max && reconnectedCount < max) || !max) {
          websocket.close()

          reconnectedTimer = setTimeout(
            () => {
              reconnectedCount++
              connect()
            },
            isExponential ? interval ** reconnectedCount : interval
          )
        }
      }
    }

    websocket.onerror = (event: Event): void => {
      onerror?.({ ...getParams(), event })
      autoReconnect()
    }
    websocket.onclose = (event: CloseEvent): void => {
      onclose?.({ ...getParams(), event })
      autoReconnect()
    }

    return websocket
  }

  return connect()
}
