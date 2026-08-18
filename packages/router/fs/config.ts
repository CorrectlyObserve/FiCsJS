import { prependSlash } from '../helpers'
import type { Routing } from '../types'
import {
  COMMENT,
  config as configConstants,
  EXTENSIONS,
  fileNames,
  metaExports,
  routerImport
} from './constants'
import { writeIfChanged } from './file'
import { getFiles, joinLines, toAbsolute, toPosix, toRelative } from './helpers'
import { findClosestDir, generateRoutes } from './route'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const buildClientEntry = ({
  layoutSpecifier,
  specifier,
  code
}: {
  layoutSpecifier: string | null
  specifier: string
  code: string
}): string => {
  const arr: string[] = [COMMENT]

  if (layoutSpecifier) arr.push(`import '${layoutSpecifier}'`)

  if (metaExports.INLINE.test(code) || metaExports.BLOCK.test(code))
    arr.push(
      `import { applyMeta } from ${routerImport()}`,
      `import * as page from '${specifier}'`,
      '',
      'applyMeta((page as { meta?: Record<string, string> }).meta)',
      ''
    )
  else arr.push(`import '${specifier}'`, '')

  return joinLines(arr)
}

export const configRoutes = (config: Routing.Config = {}): void => {
  const { dir, output, pageFile, extensions, basePath, entries }: Routing.Config = config,
    { dir: d, output: o }: { dir: string; output: string } = toAbsolute({ dir, output })

  if (!existsSync(d)) throw new Error(`The directory "${d}" does not exist...`)

  const filePaths: string[] = [],
    scan = (current: string): void => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const joined: string = join(current, entry.name)

        if (entry.isDirectory()) scan(joined)
        else if (entry.isFile()) filePaths.push(toPosix(relative(d, joined)))
      }
    }

  scan(d)

  const clientPath: string = join(o, configConstants.CLIENT),
    serverPath: string = join(o, configConstants.SERVER),
    {
      clientCode,
      serverCode,
      clientEntries,
      dirsWithoutSpaEntry
    }: ReturnType<typeof generateRoutes> = generateRoutes({
      filePaths,
      options: { baseDir: toRelative(clientPath, d), pageFile, extensions },
      basePath
    })

  writeIfChanged({ path: clientPath, content: clientCode })

  if (serverCode !== null) writeIfChanged({ path: serverPath, content: serverCode })
  else if (existsSync(serverPath)) rmSync(serverPath)

  if (entries) {
    if (dirsWithoutSpaEntry.length > 0)
      throw new Error(
        `There is no "${fileNames.SPA}" entry in ${dirsWithoutSpaEntry.map(dir => `"${prependSlash(dir)}"`).join(', ')}...`
      )

    const entriesDir: string = join(o, configConstants.ENTRIES)
    rmSync(entriesDir, { force: true, recursive: true })
    mkdirSync(entriesDir, { recursive: true })

    const clientLayoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions: extensions ?? EXTENSIONS
    })

    for (const { name, src } of clientEntries) {
      const entryPath: string = join(entriesDir, `${name}${extname(src)}`),
        layoutSrc: string | null = findClosestDir(src, clientLayoutFiles)?.value ?? null

      writeFileSync(
        entryPath,
        buildClientEntry({
          layoutSpecifier: layoutSrc ? toRelative(entryPath, join(d, layoutSrc)) : null,
          specifier: toRelative(entryPath, join(d, src)),
          code: readFileSync(join(d, src), 'utf8')
        })
      )
    }
  }
}
