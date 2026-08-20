import type { Routing } from '../../types'
import { ERROR_PATH, fileNames } from '../constants'
import { cleanPath, getDirName, getExt, removeExt } from '../helpers'
import { toEntry } from './path'

export const findClientEntries = ({
  routes,
  filePaths,
  extensions,
  spaOwners,
  areSpaEntry,
  files,
  globalStatuses,
  statusFallback
}: Routing.Build.Query &
  Pick<Routing.Build.Spa, 'spaOwners' | 'areSpaEntry' | 'files'> &
  Pick<Routing.Build.Special, 'globalStatuses' | 'statusFallback'>): {
  clientEntries: Routing.ClientEntries
  dirsWithoutSpaEntry: string[]
} => {
  const clientEntries: Routing.ClientEntries = [],
    seen: Set<string> = new Set(),
    dirsWithoutSpaEntry: Set<string> = new Set(),
    push = (name: string, src: string | null): void => {
      if (src === null || seen.has(name)) return

      seen.add(name)
      clientEntries.push({ name, src })
    }

  for (let i = 0; i < routes.length; i++) {
    const { path, src }: Routing.RouteEntry = routes[i],
      spaOwner: string | null = spaOwners[i],
      isSpa: boolean = spaOwner !== null

    /** @remarks Child pages of an SPA reuse the main SPA entry. */
    if (isSpa && !areSpaEntry[i]) continue

    const fileSrc: string | null = findFileSrc({
      filePaths,
      extensions,
      target: fileNames[isSpa ? 'SPA' : 'PAGE'],
      dir: spaOwner ?? getDirName(src)
    })

    if (!isSpa) {
      push(toEntry(path), fileSrc)
      continue
    }

    const hasSpaEntry: boolean = fileSrc !== null
    if (!hasSpaEntry) dirsWithoutSpaEntry.add(spaOwner!)

    push(toEntry(path), fileSrc)
  }

  const isOutsideSpa = (src: string): boolean => findClosestDir(src, files) === null

  for (const { path, src } of globalStatuses) if (isOutsideSpa(src)) push(toEntry(path), src)

  if (statusFallback && isOutsideSpa(statusFallback.src))
    push(toEntry(ERROR_PATH), statusFallback.src)

  return { clientEntries, dirsWithoutSpaEntry: [...dirsWithoutSpaEntry] }
}

export const findClosestDir = (
  src: string,
  map: Map<string, string>
): { key: string; value: string } | null => {
  let dir: string = getDirName(src)

  while (true) {
    if (map.has(dir)) return { key: dir, value: map.get(dir)! }

    const isRootDir: boolean = dir === ''
    if (isRootDir) return null

    const index: number = dir.lastIndexOf('/')
    dir = index === -1 ? '' : dir.slice(0, index)
  }
}

export const findFileSrc = ({
  filePaths,
  extensions,
  target,
  dir
}: {
  filePaths: string[]
  extensions: Routing.Extensions
  target: string
  dir?: string
}): string | null => {
  const prefix: string = dir ? `${dir}/` : ''

  for (const filePath of filePaths) {
    const posix: string = cleanPath(filePath)
    if (!posix.startsWith(prefix)) continue

    const relative: string = posix.slice(prefix.length),
      isSubdir: boolean = relative.includes('/')
    if (isSubdir) continue

    const ext: string = getExt(relative)
    if (!extensions.includes(ext)) continue
    if (removeExt(relative) === target) return filePath
  }

  return null
}

export const findStatusEntry = ({
  routes,
  spaOwners,
  areSpaEntry,
  path
}: Routing.RouteManifest &
  Pick<Routing.Build.Spa, 'spaOwners' | 'areSpaEntry'> & { path: string }): string => {
  for (let i = 0; i < routes.length; i++) {
    const isIndexSpaEntry: boolean = spaOwners[i] === '' && areSpaEntry[i]
    if (isIndexSpaEntry) return toEntry(routes[i].path)
  }

  return toEntry(path)
}

export const findServerFileSrc = (args: Parameters<typeof findFileSrc>[0]): string | null =>
  findFileSrc({ ...args, target: `${args.target}.server` })
