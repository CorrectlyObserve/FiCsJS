import type { I18n } from './types'

export default async ({ directory, lang, key }: I18n): Promise<string> =>
  await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      if (!Array.isArray(key)) key = [key]
      const text: string | undefined = key.reduce((acc, _key) => acc && acc[_key], json)

      if (text === undefined)
        throw new Error(`${key.join('.')} does not exist in ${directory}/${lang}.json...`)

      return text
    })
    .catch(error => {
      throw new Error(`${error}`)
    })
