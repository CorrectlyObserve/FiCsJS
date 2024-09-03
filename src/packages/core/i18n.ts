import type { LangJson } from './types'

export default async ({ langs, directory }: LangJson): Promise<Record<string, string>> => {
  const json: Record<string, string> = {}

  for (const lang of langs)
    try {
      json[lang] = await import(`${directory}/${lang}.json`)
    } catch (error) {
      throw new Error(`${error}`)
    }

  return json
}
