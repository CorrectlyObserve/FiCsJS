import { normalizePath, toArray } from '../core/helpers'
import type { SingleOrArray, Translations } from '../core/types'

let _directory: string = ''

const translationsCache: Map<string, Translations> = new Map(),
  promiseCache: Map<string, Promise<Translations>> = new Map()

export const ficsI18n = (directory: string): void => {
  const normalized: string = normalizePath(directory)

  if (_directory && _directory !== normalized) {
    translationsCache.clear()
    promiseCache.clear()
  }
  _directory = normalized
}

export const i18n = async <T>({
  lang,
  key
}: {
  lang: string
  key: SingleOrArray<string>
}): Promise<T> => {
  if (_directory === '')
    throw new Error('The ficsI18n function cannot be called before this function...')

  if (lang === '') throw new Error('The "lang" must be a non-empty string...')

  const url: string = `${_directory}/${lang}.json`,
    keys: string[] = toArray(key),
    fetchTranslations = async (lang: string): Promise<Translations> => {
      if (translationsCache.has(lang)) return translationsCache.get(lang)!
      if (promiseCache.has(lang)) return promiseCache.get(lang)!

      const translations: Promise<Translations> = (async (): Promise<Translations> => {
        try {
          const res: Response = await fetch(url)

          if (!res.ok)
            throw new Error(
              `${res.status} ${res.statusText}: The request to load the ${url} failed...`
            )

          const json: Translations = await res.json()

          translationsCache.set(lang, json)
          return json
        } catch (error) {
          throw error
        } finally {
          promiseCache.delete(lang)
        }
      })()

      promiseCache.set(lang, translations)
      return translations
    }

  const translations: Translations = await fetchTranslations(lang)

  if (keys.length === 0) return translations as T

  let _translations: Translations | undefined = translations
  for (const _key of keys) _translations = _translations?.[_key] as Translations | undefined

  if (_translations === undefined)
    throw new Error(`The key "${keys.join('.')}" does not exist in the ${url}...`)

  return _translations as T
}
