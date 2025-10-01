export const CHAT_PAGE = '/websocket-sse' as const

export const getDatetime = (): string => {
  const FORMAT = '2-digit' as const,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: FORMAT,
      day: FORMAT,
      hour: FORMAT,
      minute: FORMAT,
      second: FORMAT,
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    map = new Map(
      new Intl.DateTimeFormat(undefined, options)
        .formatToParts(new Date())
        .map(({ type, value }) => [type, value])
    ),
    createDatetimeStr = (type: 'date' | 'time'): string => {
      const isDate = type === 'date',
        keys: readonly (keyof Intl.DateTimeFormatPartTypesRegistry)[] = isDate
          ? ['year', 'month', 'day']
          : ['hour', 'minute', 'second']

      return keys.map(key => map.get(key)).join(isDate ? '-' : ':')
    }

  return `${createDatetimeStr('date')} ${createDatetimeStr('time')}`
}