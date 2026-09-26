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

const config: { directory: string; timeoutMs?: number } = { directory: '' },
  translationsCache: Map<string, Translations> = new Map(),
  promiseCache: Map<string, Promise<Translations>> = new Map()

/** @param timeoutMs Must be a non-negative integer if it is a number. */
export const configI18n = (directory: string, { timeoutMs }: { timeoutMs?: number }): void => {
  numberError({ timeoutMs }, 'non-negative-int')

  const normalized: string = isBlankString(directory) ? '' : normalizePath(directory)

  if (config.directory !== normalized) {
    translationsCache.clear()
    promiseCache.clear()
  }
  config.directory = normalized
  config.timeoutMs = timeoutMs
}

export const i18n = async <T>({ lang, key, signal }: Parameters<I18n<T>>[0]): Promise<T> => {
  if (isBlankString(config.directory))
    throw new Error('The i18n function cannot be called before calling the configI18n function...')

  if (isBlankString(lang)) throw new Error('The "lang" must be a non-empty string...')

  const url: string = `${config.directory}/${lang}.json`

  if (!isBrowser() && !url.startsWith('http'))
    throw new Error(`The i18n url "${url}" must be an absolute URL in SSR/Edge environments...`)

  const keys: string[] = toArray(key),
    downloadTranslations = async (directory: string): Promise<Translations> => {
      const controller: AbortController = new AbortController(),
        clearTimer: () => void = scheduleAbort({
          controller,
          timeoutMs: config.timeoutMs,
          message: `The request to load the ${url} timed out after ${config.timeoutMs}ms...`
        })

      try {
        const res: Response = await fetch(url, { signal: controller.signal })

        if (!res.ok)
          throw new Error(
            `${res.status} ${res.statusText}: The request to load the ${url} failed...`
          )

        const json: Translations = await res.json()

        if (config.directory === directory) translationsCache.set(lang, json)
        return json
      } finally {
        clearTimer()
      }
    },
    fetchTranslations = async (): Promise<Translations> => {
      const cached: Translations | undefined = translationsCache.get(lang)
      if (cached !== undefined) return cached

      const inflight: Promise<Translations> | undefined = promiseCache.get(lang)
      if (inflight) return inflight

      const translations: Promise<Translations> = downloadTranslations(config.directory)
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

  let nested: Translations | undefined = translations
  for (const nestedKey of keys) nested = nested?.[nestedKey] as Translations | undefined

  if (nested === undefined)
    throw new Error(`The key "${keys.join('.')}" does not exist in the ${url}...`)

  return nested as T
}
