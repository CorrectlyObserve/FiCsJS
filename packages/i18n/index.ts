import { convertToArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

interface I18nParams {
  directory: string
  lang: string
  key: SingleOrArray
  variables?: Record<string, string | number>
}
type I18n = SingleOrArray | { [keys: string]: I18n }

export default async <T>({ directory, lang, key, variables }: I18nParams): Promise<T> =>
  await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      key = convertToArray(key)
      let i18n: I18n | undefined = key.reduce((acc, _key) => acc && acc[_key], json)

      if (!i18n) throw new Error(`${key.join('.')} does not exist in ${directory}/${lang}.json...`)

      if (variables) {
        if (typeof i18n !== 'string')
          throw new Error(
            `The "variables" options are enabled only if the JSON value is of type string...`
          )

        for (const [key, value] of Object.entries(variables))
          i18n = i18n.replaceAll(`$var(${key})`, `${value}`)

        return i18n as T
      }

      return i18n as T
    })
    .catch(error => {
      throw new Error(error)
    })
