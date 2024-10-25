import { convertToArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

type I18n = SingleOrArray | { [keys: string]: I18n }

export default async <T>({
  directory,
  lang,
  keys
}: {
  directory: string
  lang: string
  keys: SingleOrArray
}): Promise<T> =>
  await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      keys = convertToArray(keys)
      const i18n: I18n | undefined = keys.reduce((acc, key) => acc && acc[key], json)

      if (i18n === undefined)
        throw new Error(`${keys.join('.')} does not exist in ${directory}/${lang}.json...`)

      return i18n as T
    })
    .catch(error => {
      throw new Error(error)
    })
