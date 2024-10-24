import type { SingleOrArray } from '../core/types'

type I18n = SingleOrArray | { [key: string]: I18n }

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
      if (!Array.isArray(key)) key = [key]

      const i18n: I18n | undefined = key.reduce((acc, _key) => acc && acc[_key], json)

      if (i18n === undefined)
        throw new Error(`${key.join('.')} does not exist in ${directory}/${lang}.json...`)

      return i18n as T
    })
    .catch(error => {
      throw new Error(error)
    })
