import { isBlankString, isBrowser, normalizePath, toArray } from '../core/helpers'
import type { I18n, Translations } from '../core/types'

const i18nClosure = (() => {
  let _directory: string = ''
  const translationsCache: Map<string, Translations> = new Map(),
    promiseCache: Map<string, Promise<Translations>> = new Map()

  return {
    configI18n: (directory: string): void => {
      const normalized: string = isBlankString(directory) ? '' : normalizePath(directory)

      if (_directory && _directory !== normalized) {
        translationsCache.clear()
        promiseCache.clear()
      }
      _directory = normalized
    },
    i18n: async <T>({ lang, key }: Parameters<I18n['i18n']>[0]): Promise<T> => {
      if (isBlankString(_directory))
        throw new Error(
          'The i18n function cannot be called before calling the configI18n function...'
        )

      if (isBlankString(lang)) throw new Error('The "lang" must be a non-empty string...')

      const url: string = `${_directory}/${lang}.json`

      if (!isBrowser() && !url.startsWith('http'))
        throw new Error(`The i18n url "${url}" must be an absolute URL in SSR/Edge environments...`)

      const keys: string[] = toArray(key),
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
  }
})()

export const { configI18n, i18n } = i18nClosure
