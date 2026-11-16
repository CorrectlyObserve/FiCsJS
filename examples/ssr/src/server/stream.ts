import { toActivity } from '@/domain/activity'

type SseSender = (event: string, data: string) => void

const HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  'x-accel-buffering': 'no'
} as const

const PING_INTERVAL_MS = 30_000 as const
const streamConfigs = {
  RANDOM_LENGTH: 1000,
  CHUNK_SIZE: 10,
  CHUNK_DELAY_MS: 100,
  ALPHANUMERIC_RADIX: 36,
  UPPERCASE_PROBABILITY: 0.5
} as const

const sseClients: Set<SseSender> = new Set()
const encoder: TextEncoder = new TextEncoder()

export const broadcastSseMessage = (message: string): void => {
  for (const send of sseClients)
    try {
      send('log', toActivity(message))
    } catch {
      sseClients.delete(send)
    }
}

export const openLogStream = (req: Request): Response => {
  let send: SseSender = () => {}
  let ping: ReturnType<typeof setInterval> | undefined

  const stop = (): void => {
    sseClients.delete(send)
    clearInterval(ping)
  }

  const stream: ReadableStream = new ReadableStream({
    start(controller) {
      send = (event: string, data: string): void =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`))

      sseClients.add(send)
      send('ping', 'ping')

      ping = setInterval(() => send('ping', 'ping'), PING_INTERVAL_MS)
      req.signal.addEventListener(
        'abort',
        () => {
          stop()
          controller.close()
        },
        { once: true }
      )
    },
    cancel: stop
  })

  return new Response(stream, { headers: HEADERS })
}

export const openTextStream = (req: Request): Response => {
  const { ALPHANUMERIC_RADIX, CHUNK_DELAY_MS, CHUNK_SIZE, RANDOM_LENGTH, UPPERCASE_PROBABILITY } =
    streamConfigs

  const stream: ReadableStream = new ReadableStream({
    async start(controller) {
      const chars = [...Array(ALPHANUMERIC_RADIX)]
        .map((_, i) => i.toString(ALPHANUMERIC_RADIX))
        .join('')
      const random: string[] = []

      for (let i = 0; i < RANDOM_LENGTH; i++) {
        const char = chars.charAt(Math.floor(Math.random() * chars.length))
        random.push(Math.random() < UPPERCASE_PROBABILITY ? char.toUpperCase() : char)
      }

      const fullText = random.join('')

      for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        if (req.signal.aborted) {
          controller.close()
          return
        }
        const chunk = fullText.slice(i, i + CHUNK_SIZE)
        const payload = JSON.stringify({ chunk, index: Math.floor(i / CHUNK_SIZE) })

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS))
      }

      controller.enqueue(encoder.encode('event: complete\ndata: \n\n'))
      controller.close()
    }
  })

  return new Response(stream, { headers: HEADERS })
}
