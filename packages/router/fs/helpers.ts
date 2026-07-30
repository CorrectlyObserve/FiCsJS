import { joinArray, removeTrailingSlash } from '../../core/helpers'
import type { Routing } from '../types'
import { config, EXTENSIONS, fileNames, segments } from './constants'
import { dirname, relative, resolve } from 'node:path'

const { LAYOUT, MIDDLEWARE, PAGE, RPC, SPA_CONFIG } = fileNames

export const buildRoute = (pathSegments: string[]): string => {
  return pathSegments
    .map((segment: string) => {
      const catchAll: RegExpMatchArray | null = segment.match(segments.CATCH_ALL)
      if (catchAll) return `:${catchAll[1]}*`

      const dynamic: RegExpMatchArray | null = segment.match(segments.DYNAMIC)
      if (dynamic) return `:${dynamic[1]}`

      if (segment.includes('[') || segment.includes(']'))
        throw new Error(`The segment "${segment}" is invalid...`)

      return segment
    })
    .join('/')
}

export const cleanPath = (path: string): string => toPosix(path).replace(/^\.?\//, '')

export const getDirName = (path: string, { clean = true }: { clean?: boolean } = {}): string =>
  (clean ? cleanPath(path) : path).split('/').slice(0, -1).join('/')

export const getExt = (file: string): string => {
  const dot: number = file.lastIndexOf('.')
  return dot <= 0 ? '' : file.slice(dot)
}

export function getFiles(
  ctx: Routing.FilesQuery<typeof LAYOUT | typeof SPA_CONFIG>
): Map<string, string>

export function getFiles(ctx: Routing.FilesQuery<typeof MIDDLEWARE>): Map<string, string>
export function getFiles(
  ctx: Routing.FilesQuery<typeof RPC> & { baseDir: string }
): Routing.RpcEntries

export function getFiles({
  filePaths,
  extensions,
  expectedType,
  baseDir
}: Routing.FilesQuery<typeof LAYOUT | typeof MIDDLEWARE | typeof RPC | typeof SPA_CONFIG> & {
  baseDir?: string
}): Map<string, string> | Routing.RpcEntries {
  const files: Map<string, string> = new Map(),
    rpcs: Routing.RpcEntries = []

  for (const path of filePaths) {
    const segments: string[] = cleanPath(path).split('/'),
      file: string = segments.at(-1) ?? ''

    if (!isValidFileType({ file, expectedType, extensions })) continue

    const dirs: string[] = segments.slice(0, -1)

    if (expectedType === RPC && baseDir)
      rpcs.push({
        dirs: dirs.filter(seg => seg !== 'index'),
        specifier: toSpecifier(path, baseDir)
      })
    else files.set(dirs.join('/'), path)
  }

  /** @remarks Ensures deterministic build output across different OS file systems. */
  if (expectedType === RPC)
    return rpcs.sort(({ specifier: a }, { specifier: b }) => (a < b ? -1 : a > b ? 1 : 0))

  return files
}

export const getOrThrow = <V>(map: Map<string, V>, key: string): V => {
  const value: V | undefined = map.get(key)
  if (value === undefined) throw new Error(`The map has no entry with key "${key}"...`)

  return value
}

export const indent = (length: number = 1): string => ' '.repeat(length * 2)

export const isValidFileType = ({
  file,
  expectedType,
  extensions
}: {
  file: string
  expectedType: typeof LAYOUT | typeof MIDDLEWARE | typeof PAGE | typeof RPC | typeof SPA_CONFIG
  extensions: Routing.Extensions
}): boolean => {
  if (!extensions.includes(getExt(file))) return false
  return removeExt(file) === expectedType
}

export const joinAndWrap = (
  arr: string[],
  { wrapType = '{}', separator = ',' }: { wrapType?: '{}' | '[]'; separator?: string } = {}
): string => {
  const joined: string = joinArray(arr, { space: true, separator })
  return wrapType === '{}' ? `{ ${joined} }` : `[${joined}]`
}

export const joinLines = (lines: string[], { comma }: { comma?: boolean } = {}): string =>
  lines.join(`${comma ? ',' : ''}\n`)

export const removeExt = (file: string): string => {
  const ext: string = getExt(file)
  return ext === '' ? file : file.slice(0, file.length - ext.length)
}

export const resolveOptions = (
  options?: Routing.Options.Generate
): Required<Pick<Routing.Options.Generate, 'baseDir' | 'extensions'>> => ({
  baseDir: options?.baseDir ?? config.IMPORT_BASE,
  extensions: options?.extensions ?? EXTENSIONS
})

export const toAbsolute = <T extends Record<string, string | undefined>>(
  paths: T
): { [K in keyof T]: string } => {
  const result: { [K in keyof T]: string } = {} as { [K in keyof T]: string }

  for (const key in paths) {
    const value: string | undefined = paths[key]

    switch (key) {
      case 'dir':
        result[key] = resolve(value || config.SCANNED_DIR)
        break

      case 'output':
        result[key] = resolve(value || config.OUTPUT)
        break

      default:
        if (value !== undefined) result[key] = resolve(value)
    }
  }

  return result
}

export const toPascal = (path: string): string =>
  path
    .split(/[-_/]/)
    .reduce(
      (prev, curr) => `${prev}${curr === '' ? '' : curr[0].toUpperCase() + curr.slice(1)}`,
      ''
    )

export const toRelative = (from: string, to: string): string => {
  const _relative: string = toPosix(relative(dirname(from), to))
  return _relative.startsWith('.') ? _relative : `./${_relative}`
}

export const toSpecifier = (path: string, baseDir: string): string =>
  `${removeTrailingSlash(baseDir)}/${removeExt(cleanPath(path))}`

/** @remarks Means Portable Operating System Interface */
export const toPosix = (path: string): string => path.replace(/\\/g, '/')
