import { convertToArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

export default async <T>({
  directory,
  lang,
  key
}: {
  directory: string
  lang: string
  key: SingleOrArray
}): Promise<T> =>
  await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      key = convertToArray(key)
      let i18n: T | undefined = key.reduce((acc, _key) => acc && acc[_key], json)

      if (i18n) return i18n
      throw new Error(`${key.join('.')} does not exist in ${`${directory}/${lang}.json`}...`)
    })
    .catch(error => {
      throw new Error(error)
    })
