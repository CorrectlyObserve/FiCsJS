import { oklch, remToPx } from 'ficsjs/style'

export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const convertTimestamp = (timestamp: number): string => {
  const modifyFormat = (param: number) => param.toString().padStart(2, '0'),
    date = new Date(timestamp),
    year = date.getFullYear(),
    month = modifyFormat(date.getMonth() + 1),
    day = modifyFormat(date.getDate()),
    hours = modifyFormat(date.getHours()),
    minutes = modifyFormat(date.getMinutes()),
    seconds = modifyFormat(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const getTimestamp = (): number => Date.now()

export const measureOffsetWidth = (): boolean =>
  document.documentElement.offsetWidth >= remToPx(breakpoints.lg)

export const white: string = oklch('#fff')
