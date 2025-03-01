export const breakpoints = { sm: '30rem', lg: '60rem' } as const

export const convertTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const getPath = (lang: string, path: string): string =>
  `${lang === 'en' ? '' : `/${lang}`}${path}`

export const getTimestamp = (): number => Date.now()

export const white: string = '#fff'
