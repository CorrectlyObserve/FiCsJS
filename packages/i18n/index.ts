import { toArray } from '../core/helpers'
import type { SingleOrArray } from '../core/types'
import createState from '../state/'
import State from '../state/state'

let _directory: State<string>

export const ficsI18n = (directory: string) => {
  _directory = createState(directory, { readonly: true })
}

export const i18n = async <T>({
  directory,
  lang,
  key
}: {
  directory?: string
  lang: string
  key: SingleOrArray<string>
}): Promise<T> => {
  if (!directory) directory = _directory.get()

  return await fetch(`${directory}/${lang}.json`)
    .then(res => res.json())
    .then(json => {
      key = toArray(key)
      let i18n: T | undefined = key.reduce((prev, curr) => prev && prev[curr], json)

      if (i18n) return i18n
      throw new Error(`The ${key.join('.')} does not exist in ${`${directory}/${lang}.json`}...`)
    })
    .catch(error => {
      throw new Error(error)
    })
}
