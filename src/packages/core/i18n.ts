const json = async ({
  langs,
  directory
}: {
  langs: string[]
  directory: string
}): Promise<Record<string, string>> => {
  const json: Record<string, string> = {}

  for (const lang of langs) json[lang] = await import(`${directory}/${lang}.json`)

  return json
}

export default json
