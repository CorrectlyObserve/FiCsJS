const FORMAT = '2-digit' as const
const DATE_KEYS = ['year', 'month', 'day'] as const
const TIME_KEYS = ['hour', 'minute', 'second'] as const

const datetimeCache: { format?: Intl.DateTimeFormat } = {}
const getDatetimeFormat = (): Intl.DateTimeFormat => {
  if (datetimeCache.format) return datetimeCache.format

  const format: Intl.DateTimeFormat = new Intl.DateTimeFormat(
    'ja-JP',
    getOptions(Intl.DateTimeFormat().resolvedOptions().timeZone)
  )

  datetimeCache.format = format
  return format
}

const getOptions = (timeZone: string): Intl.DateTimeFormatOptions => ({
  year: 'numeric',
  month: FORMAT,
  day: FORMAT,
  hour: FORMAT,
  minute: FORMAT,
  second: FORMAT,
  hour12: false,
  timeZone
})

export const convertTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)

  if (!Number.isInteger(date.getTime())) return ''

  const map = new Map(
      getDatetimeFormat()
        .formatToParts(date)
        .map(({ type, value }) => [type, value])
    ),
    dateStr = DATE_KEYS.map(key => map.get(key)).join('-'),
    timeStr = TIME_KEYS.map(key => map.get(key)).join(':')

  return `${dateStr} ${timeStr}`
}

export const getTimestamp = (): number => Date.now()