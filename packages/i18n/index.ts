import { convertToArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

type I18n = SingleOrArray | { [keys: string]: I18n }

export default async <T>(params: {
  directory: string
  lang: string
  key: SingleOrArray
  variables?: Record<string, string | number>
}): Promise<T> => {
  const path: string = `${params.directory}/${params.lang}.json`

  return await fetch(path)
    .then(res => res.json())
    .then(json => {
      const keys: string[] = convertToArray(params.key)
      let i18n: I18n | undefined = keys.reduce((acc, key) => acc && acc[key], json)

      if (!i18n) throw new Error(`${keys.join('.')} does not exist in ${path}...`)

      const replaceText = (str: string, key: string, value: string | number): string =>
        str.replaceAll(`$var(${key})`, `${value}`)

      const replaceI18n = (i18n: I18n, variables: Record<string, string | number>): void => {
        for (const [key, value] of Object.entries(variables))
          if (typeof i18n === 'string') i18n = replaceText(i18n, key, value)
          else if (Array.isArray(i18n))
            for (let i = 0; i < i18n.length; i++)
              if (typeof i18n[i] === 'string') i18n[i] = replaceText(i18n[i], key, value)
              else replaceI18n(i18n[i], variables)
          else
            for (const _key of Object.keys(i18n))
              if (typeof i18n[_key] === 'string') i18n[_key] = replaceText(i18n[_key], key, value)
              else replaceI18n(i18n[_key], variables)
      }

      if (params.variables) replaceI18n(i18n, params.variables)
      return i18n as T
    })
    .catch(error => {
      throw new Error(error)
    })
}
