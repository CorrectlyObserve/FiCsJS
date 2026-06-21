import { removeTrailingSlash } from './../../core/helpers'
import type { Routing, ServerFile } from '../types'
import { fileNames } from './constants'
import { resolve } from 'node:path'

const { LAYOUT, PAGE, SERVER, SPA } = fileNames

export const cleanPath = (path: string): string => toPosix(path).replace(/^\.?\//, '')

export function collectFiles(
  ctx: Routing.Ctx.CollectFiles<typeof LAYOUT | typeof SPA>
): Map<string, string>

export function collectFiles(
  ctx: Routing.Ctx.CollectFiles<typeof SERVER> & { baseDir: string }
): ServerFile[]

export function collectFiles({
  filePaths,
  extensions,
  expectedType,
  baseDir
}: Routing.Ctx.CollectFiles<typeof LAYOUT | typeof SPA | typeof SERVER> & { baseDir?: string }):
  | Map<string, string>
  | ServerFile[] {
  const files: Map<string, string> = new Map(),
    serverFiles: ServerFile[] = []

  for (const path of filePaths) {
    const segments: string[] = cleanPath(path).split('/'),
      file: string = segments.at(-1) ?? ''

    if (!isValidFileType({ file, expectedType, extensions })) continue

    const _segments: string[] = segments.slice(0, -1)

    if (expectedType === SERVER && baseDir) {
      serverFiles.push({
        dirSegments: _segments.filter(seg => seg !== 'index'),
        specifier: toSpecifier(path, baseDir)
      })
    } else files.set(_segments.join('/'), path)
  }

  /** @remarks Ensures deterministic build output across different OS file systems. */
  if (expectedType === SERVER)
    return serverFiles.sort(({ specifier: a }, { specifier: b }) => (a < b ? -1 : a > b ? 1 : 0))

  return files
}

export const getExt = (file: string): string => {
  const dot: number = file.lastIndexOf('.')
  return dot <= 0 ? '' : file.slice(dot)
}

export const getDirName = (path: string, isPathCleaned: boolean = true): string =>
  (isPathCleaned ? cleanPath(path) : path).split('/').slice(0, -1).join('/')

export const isValidFileType = ({
  file,
  expectedType,
  extensions
}: {
  file: string
  expectedType: typeof LAYOUT | typeof PAGE | typeof SPA | typeof SERVER
  extensions: Routing.Extensions
}): boolean => {
  if (!extensions.includes(getExt(file))) return false
  return removeExt(file) === expectedType
}

export const removeExt = (file: string): string => {
  const ext: string = getExt(file)
  return ext === '' ? file : file.slice(0, file.length - ext.length)
}

export const toAbsolute = <T extends Record<string, string | undefined>>(
  paths: T
): { [K in keyof T]: string } => {
  const result: { [K in keyof T]: string } = {} as { [K in keyof T]: string }

  for (const key in paths) {
    const value: string | undefined = paths[key]

    switch (key) {
      case 'dir':
        result[key] = resolve(value ?? 'src/pages')
        break

      case 'output':
        result[key] = resolve(value ?? 'src/routes.gen.ts')
        break

      default:
        if (value !== undefined) result[key] = resolve(value)
    }
  }

  return result
}

export const toSpecifier = (path: string, baseDir: string): string =>
  `${removeTrailingSlash(baseDir)}/${removeExt(cleanPath(path))}`

/** @remarks Means Portable Operating System Interface */
export const toPosix = (path: string): string => path.replace(/\\/g, '/')
