import { toArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

let _directory: string = ''

export const ficsI18n = (directory: string): void => {
  _directory = directory
}

export const i18n = async <T>({
  lang,
  key
}: {
  lang: string
  key: SingleOrArray<string>
}): Promise<T> => {
  const json: string = `${_directory}/${lang}.json`

  return await fetch(json)
    .then(res => res.json())
    .then(json => {
      key = toArray(key)
      let i18n: T | undefined = key.reduce((prev, curr) => prev && prev[curr], json)

      if (i18n) return i18n
      throw new Error(`The ${key.join('.')} does not exist in the ${json}...`)
    })
    .catch(error => {
      throw new Error(error)
    })
}
