import {
  attachSignal,
  isBlankString,
  isBrowser,
  normalizePath,
  numberError,
  scheduleAbort,
  toArray
} from '../core/helpers'
import type { I18n, Translations } from '../core/types'

const i18nClosure = (() => {
  let _directory: string = '',
    _timeoutMs: number | undefined

  const translationsCache: Map<string, Translations> = new Map(),
    promiseCache: Map<string, Promise<Translations>> = new Map()

  return {
    /** @params Must be a non-negative integer if it is a number. */
    configI18n: (directory: string, { timeoutMs }: { timeoutMs?: number }): void => {
      numberError({ timeoutMs }, 'non-negative-int')

      const normalized: string = isBlankString(directory) ? '' : normalizePath(directory)

      if (_directory && _directory !== normalized) {
        translationsCache.clear()
        promiseCache.clear()
      }
      _directory = normalized
      _timeoutMs = timeoutMs
    },
    i18n: async <T>({ lang, key, signal }: Parameters<I18n<T>>[0]): Promise<T> => {
      if (isBlankString(_directory))
        throw new Error(
          'The i18n function cannot be called before calling the configI18n function...'
        )

      if (isBlankString(lang)) throw new Error('The "lang" must be a non-empty string...')

      const url: string = `${_directory}/${lang}.json`

      if (!isBrowser() && !url.startsWith('http'))
        throw new Error(`The i18n url "${url}" must be an absolute URL in SSR/Edge environments...`)

      const keys: string[] = toArray(key),
        download = async (directory: string): Promise<Translations> => {
          const controller: AbortController = new AbortController()

          try {
            const res: Response = await fetch(url, { signal: controller.signal })

            if (!res.ok)
              throw new Error(
                `${res.status} ${res.statusText}: The request to load the ${url} failed...`
              )

            const json: Translations = await res.json()

            if (_directory === directory) translationsCache.set(lang, json)
            return json
          } finally {
            scheduleAbort({
              controller,
              timeoutMs: _timeoutMs,
              message: `The request to load the ${url} timed out after ${_timeoutMs}ms...`
            })
          }
        },
        fetchTranslations = async (): Promise<Translations> => {
          const cached: Translations | undefined = translationsCache.get(lang)
          if (cached !== undefined) return cached

          const inflight: Promise<Translations> | undefined = promiseCache.get(lang)
          if (inflight) return inflight

          const translations: Promise<Translations> = download(_directory)

          promiseCache.set(lang, translations)

          try {
            return await translations
          } finally {
            /** @remarks The entry may already belong to a download from the new directory. */
            if (promiseCache.get(lang) === translations) promiseCache.delete(lang)
          }
        }

      const translations: Translations = await attachSignal(fetchTranslations(), signal)
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
