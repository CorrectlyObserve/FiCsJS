import { isBlankObject } from './helpers'
import type { DataProps, Options, WebSocketCtx, WebSocketProp } from './types'

export const openWebSocket = <D extends object, P extends object>({
  websocketConfig,
  getDataProps,
  setWebSocketProp
}: {
  websocketConfig: Options<D, P>['websocket']
  getDataProps: <B extends boolean = false>(isCrud?: B) => DataProps<D, P, B>
  setWebSocketProp: (value?: WebSocketProp) => void
}): WebSocket | undefined => {
  const config: Options<D, P>['websocket'] | undefined = websocketConfig
  if (!config || isBlankObject(config)) return undefined

  let reconnectedCount: number = 0,
    reconnectedTimer: ReturnType<typeof setTimeout> | null = null

  const {
      path,
      protocols,
      reconnect,
      onopen,
      onmessage,
      onerror,
      onclose
    }: Options<D, P>['websocket'] = config,
    { protocol, host }: { protocol: string; host: string } = window.location

  const connect = (): WebSocket => {
    const wsUrl: URL = new URL(path, `${protocol}//${host}`)
    wsUrl.protocol = protocol.startsWith('https') ? 'wss:' : 'ws:'

    const websocket: WebSocket = new WebSocket(wsUrl.toString(), protocols),
      getContext: () => Omit<WebSocketCtx<D, P>, 'event'> = () => ({
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

      onopen?.({ ...getContext(), event })
    }

    websocket.onmessage = (event: MessageEvent): void => onmessage?.({ ...getContext(), event })

    const autoReconnect = (): void => {
      if (reconnect && !reconnectedTimer) {
        const {
          interval,
          max,
          isExponential
        }: NonNullable<Options<D, P>['websocket']>['reconnect'] = reconnect

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
      onerror?.({ ...getContext(), event })
      autoReconnect()
    }
    websocket.onclose = (event: CloseEvent): void => {
      onclose?.({ ...getContext(), event })
      autoReconnect()
    }

    return websocket
  }

  return connect()
}
