import { isBlankObject } from './helpers'
import type { GetDataProps, Options, WebSocketCtx, WebSocketProp } from './types'

type WSOptions<D extends object, P extends object> = Options<D, P>['websocket']

interface Ctx<D extends object, P extends object> {
  wsOptions: WSOptions<D, P>
  getDataProps: GetDataProps<D, P>
  setWebSocketProp: (value?: WebSocketProp) => void
}

export const openWebSocket = <D extends object, P extends object>({
  wsOptions,
  getDataProps,
  setWebSocketProp
}: Ctx<D, P>): WebSocket | undefined => {
  const ws: WSOptions<D, P> | undefined = wsOptions
  if (!ws || isBlankObject(ws)) return undefined

  let reconnectedCount: number = 0,
    reconnectedTimer: ReturnType<typeof setTimeout> | null = null

  const { path, protocols, reconnect, onopen, onmessage, onerror, onclose }: WSOptions<D, P> = ws,
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
        const { interval, max, isExponential }: NonNullable<WSOptions<D, P>>['reconnect'] =
          reconnect

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
