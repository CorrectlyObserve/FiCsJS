import { Html } from '@/libs/types'

export const convertToArray = (html: Html | Html[]) => (Array.isArray(html) ? [...html] : [html])

export const toKebabCase = (str: string): string => {
  const newStr = str.slice(1)
  let body = newStr
  const upperCase = new RegExp(/[A-Z]/g)

  if (upperCase.test(newStr)) body = newStr.replace(upperCase, val => `-${val.toLowerCase()}`)

  return str[0].toLowerCase() + body
}
