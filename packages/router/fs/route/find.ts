import type { Routing } from './../../types'
import { cleanPath, getDirName, getExt, removeExt } from './../helpers'

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

export const findSpecificFile = ({
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
