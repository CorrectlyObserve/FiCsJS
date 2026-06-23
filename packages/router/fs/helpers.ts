import { removeTrailingSlash } from './../../core/helpers'
import type { Routing } from '../types'
import { configDefaults, fileNames } from './constants'
import { dirname, relative, resolve } from 'node:path'

const { LAYOUT, PAGE, SERVER, SPA } = fileNames

export const cleanPath = (path: string): string => toPosix(path).replace(/^\.?\//, '')

export const getDirName = (path: string, isPathCleaned: boolean = true): string =>
  (isPathCleaned ? cleanPath(path) : path).split('/').slice(0, -1).join('/')

export const getExt = (file: string): string => {
  const dot: number = file.lastIndexOf('.')
  return dot <= 0 ? '' : file.slice(dot)
}

export function getFiles(ctx: Routing.FilesQuery<typeof LAYOUT | typeof SPA>): Map<string, string>

export function getFiles(
  ctx: Routing.FilesQuery<typeof SERVER> & { baseDir: string }
): Routing.Rpc[]

export function getFiles({
  filePaths,
  extensions,
  expectedType,
  baseDir
}: Routing.FilesQuery<typeof LAYOUT | typeof SPA | typeof SERVER> & { baseDir?: string }):
  | Map<string, string>
  | Routing.Rpc[] {
  const files: Map<string, string> = new Map(),
    rpcs: Routing.Rpc[] = [],
    isRpc: boolean = expectedType === SERVER

  for (const path of filePaths) {
    const segments: string[] = cleanPath(path).split('/'),
      file: string = segments.at(-1) ?? ''

    if (!isValidFileType({ file, expectedType, extensions })) continue

    const dirs: string[] = segments.slice(0, -1)

    if (isRpc && baseDir)
      rpcs.push({
        dirs: dirs.filter(seg => seg !== 'index'),
        specifier: toSpecifier(path, baseDir)
      })
    else files.set(dirs.join('/'), path)
  }

  /** @remarks Ensures deterministic build output across different OS file systems. */
  if (isRpc) return rpcs.sort(({ specifier: a }, { specifier: b }) => (a < b ? -1 : a > b ? 1 : 0))

  return files
}

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
        result[key] = resolve(value || configDefaults.DIR)
        break

      case 'output':
        result[key] = resolve(value || configDefaults.OUTPUT)
        break

      default:
        if (value !== undefined) result[key] = resolve(value)
    }
  }

  return result
}

export const toRelative = (from: string, to: string): string => {
  const _relative: string = toPosix(relative(dirname(from), to))
  return _relative.startsWith('.') ? _relative : `./${_relative}`
}

export const toSpecifier = (path: string, baseDir: string): string =>
  `${removeTrailingSlash(baseDir)}/${removeExt(cleanPath(path))}`

/** @remarks Means Portable Operating System Interface */
export const toPosix = (path: string): string => path.replace(/\\/g, '/')
