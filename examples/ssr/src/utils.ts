import { oklch } from 'ficsjs/style'

export const CHAT_PAGE = '/websocket-sse' as const

const datetimeCache: { format?: Intl.DateTimeFormat } = {},
  FORMAT = '2-digit' as const,
  dateKeys = ['year', 'month', 'day'] as const,
  timeKeys = ['hour', 'minute', 'second'] as const,
  getOptions = (timeZone: string): Intl.DateTimeFormatOptions => ({
    year: 'numeric',
    month: FORMAT,
    day: FORMAT,
    hour: FORMAT,
    minute: FORMAT,
    second: FORMAT,
    hour12: false,
    timeZone
  }),
  getDatetimeFormat = (): Intl.DateTimeFormat => {
    if (datetimeCache.format) return datetimeCache.format

    const format: Intl.DateTimeFormat = new Intl.DateTimeFormat(
      'ja-JP',
      getOptions(Intl.DateTimeFormat().resolvedOptions().timeZone)
    )

    datetimeCache.format = format
    return format
  }

export const getTimestamp = (): string => {
  const map = new Map(
      getDatetimeFormat()
        .formatToParts(new Date())
        .map(({ type, value }) => [type, value])
    ),
    date = dateKeys.map(key => map.get(key)).join('-'),
    time = timeKeys.map(key => map.get(key)).join(':')

  return `${date} ${time}`
}

export const WEBSOCKET_PATH = '/ws' as const

export const white = (opacity: number = 1) => oklch('#fff', { opacity })
