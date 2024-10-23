import type { SingleOrArray } from '../core/types'

type I18n = SingleOrArray | { [key: string]: I18n }

export default async({
  directory,
  lang,
  key
}: {
  directory: string
  lang: string
  key: SingleOrArray
}): Promise<I18n> =>
  await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      if (!Array.isArray(key)) key = [key]
      const i18n: I18n | undefined = key.reduce((acc, _key) => acc && acc[_key], json)

      if (i18n === undefined)
        throw new Error(`${key.join('.')} does not exist in ${directory}/${lang}.json...`)

      if (typeof i18n === 'string') return i18n as string

      if (Array.isArray(i18n)) return i18n as string[]

      return i18n
    })
    .catch(error => {
      throw new Error(error)
    })
