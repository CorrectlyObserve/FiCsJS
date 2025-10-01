import { oklch, remToPx } from 'ficsjs/style'

export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const convertTimestamp = (timestamp: number): string => {
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
        .formatToParts(new Date(timestamp))
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

export const getTimestamp = (): number => Date.now()

export const measureOffsetWidth = (): boolean =>
  document.documentElement.offsetWidth >= remToPx(breakpoints.lg)

export const white: string = oklch('#fff')
