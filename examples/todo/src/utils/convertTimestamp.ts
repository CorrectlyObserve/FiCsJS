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

export default (timestamp: number): string => {
  const date = new Date(timestamp)

  if (!Number.isFinite(date.getTime())) return ''

  const map = new Map(
      getDatetimeFormat()
        .formatToParts(date)
        .map(({ type, value }) => [type, value])
    ),
    dateStr = dateKeys.map(key => map.get(key)).join('-'),
    timeStr = timeKeys.map(key => map.get(key)).join(':')

  return `${dateStr} ${timeStr}`
}
