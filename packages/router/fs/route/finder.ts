import type { Routing } from '../../types'
import { fileNames } from '../constants'
import { cleanPath, getDirName, getExt, removeExt } from '../helpers'
import { toEntry } from './path'

export const findClientEntries = ({
  routes,
  filePaths,
  extensions,
  spaOwners,
  areSpaRoot,
  files,
  globalStatus
}: Routing.Build.Query &
  Pick<Routing.Build.Spa, 'spaOwners' | 'areSpaRoot' | 'files'> &
  Pick<Routing.Build.Special, 'globalStatus'>): {
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

    /** @remarks Shares the root SPA entry with sub-pages. */
    if (isSpa && !areSpaRoot[i]) continue

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

  for (const { path, src } of globalStatus) {
    const isStatusFileOutsideSpa: boolean = findClosestDir(src, files) === null
    if (isStatusFileOutsideSpa) push(toEntry(path), src)
  }

  return { clientEntries, dirsWithoutSpaEntry: [...dirsWithoutSpaEntry] }
}

export const findClosestDir = (
  src: string,
  map: Map<string, string>
): { key: string; value: string } | null => {
  let dir: string = getDirName(src)

  while (true) {
    if (map.has(dir)) return { key: dir, value: map.get(dir)! }
    if (dir === '') return null

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

export const findTopSpaEntry = ({
  routes,
  spaOwners,
  areSpaRoot
}: Routing.RouteManifest & Pick<Routing.Build.Spa, 'spaOwners' | 'areSpaRoot'>): string | null => {
  for (let i = 0; i < routes.length; i++) {
    const isTopSpa: boolean = spaOwners[i] === ''
    if (isTopSpa && areSpaRoot[i]) return toEntry(routes[i].path)
  }
  return null
}
