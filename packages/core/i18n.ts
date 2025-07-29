import { toArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'

let _directory: string = ''
const caches: Map<string, any> = new Map()

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

  if (!caches.has(lang))
    caches.set(
      lang,
      await fetch(json)
        .then(res => res.json())
        .catch(error => {
          throw new Error(error)
        })
    )

  key = toArray(key)
  let i18n: T | undefined = key.reduce((prev, curr) => prev && prev[curr], caches.get(lang))

  if (i18n) return i18n
  throw new Error(`The ${key.join('.')} does not exist in the ${json}...`)
}
