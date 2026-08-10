import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export const readIfExists = (path: string): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8') : null

export const writeIfChanged = (path: string, content: string): boolean => {
  if (readIfExists(path) === content) return false

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)

  return true
}
