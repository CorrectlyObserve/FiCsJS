export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const convertTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const modifyFormat = (param: number) => param.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = modifyFormat(date.getMonth() + 1)
  const day = modifyFormat(date.getDate())
  const hours = modifyFormat(date.getHours())
  const minutes = modifyFormat(date.getMinutes())
  const seconds = modifyFormat(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const getPath = (lang: string, path: string): string =>
  `${lang === 'en' ? '' : `/${lang}`}${path}`

export const getTimestamp = (): number => Date.now()

export const white: string = '#fff'
