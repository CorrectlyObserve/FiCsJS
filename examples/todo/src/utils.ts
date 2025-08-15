import { goto } from 'ficsjs/router'
import type { Lang } from '@/types'

export const backToTop = (lang: Lang): void => goto(`/${lang}`)

export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const convertTimestamp = (timestamp: number): string => {
  const modifyFormat = (param: number) => param.toString().padStart(2, '0')
  const date = new Date(timestamp),
    year = date.getFullYear(),
    month = modifyFormat(date.getMonth() + 1),
    day = modifyFormat(date.getDate()),
    hours = modifyFormat(date.getHours()),
    minutes = modifyFormat(date.getMinutes()),
    seconds = modifyFormat(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const getTimestamp = (): number => Date.now()

export const white: string = '#fff'
