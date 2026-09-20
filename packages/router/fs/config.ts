import type { Routing } from '../types'
import { COMMENT, config as c, EXTENSIONS, fileNames, metaExports } from './constants'
import { writeIfChanged } from './file'
import {
  excludePrivateDirs,
  getFiles,
  joinLines,
  routerImport,
  toAbsolute,
  toPosix,
  toRelative
} from './helpers'
import { findClosestDir, generateRoutes } from './route'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const emitClientEntry = ({
  layoutSpecifier,
  pageSpecifier,
  spaRouter,
  code
}: {
  layoutSpecifier: string | null
  pageSpecifier: string
  spaRouter: { name: string; specifier: string } | null
  code: string
}): string => {
  const arr: string[] = [COMMENT]

  if (layoutSpecifier) arr.push(`import '${layoutSpecifier}'`)

  if (spaRouter)
    arr.push(
      `import { ${spaRouter.name} } from '${spaRouter.specifier}'`,
      '',
      `${spaRouter.name}.describe()`,
      ''
    )
  else if (metaExports.INLINE.test(code) || metaExports.BLOCK.test(code))
    arr.push(
      `import { applyMeta } from ${routerImport()}`,
      `import * as page from '${pageSpecifier}'`,
      '',
      'applyMeta((page as { meta?: Record<string, string> }).meta)',
      ''
    )
  else arr.push(`import '${pageSpecifier}'`, '')

  return joinLines(arr)
}

export const configRoutes = (config: Routing.Config = {}): void => {
  const { dir, output, pageFile, extensions, basePath, entries }: Routing.Config = config,
    { dir: d, output: o }: { dir: string; output: string } = toAbsolute({ dir, output })

  if (!existsSync(d)) throw new Error(`The directory "${d}" does not exist...`)

  const scannedPaths: string[] = [],
    scan = (current: string): void => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const joined: string = join(current, entry.name)

        if (entry.isDirectory()) scan(joined)
        else if (entry.isFile()) scannedPaths.push(toPosix(relative(d, joined)))
      }
    }

  scan(d)

  const filePaths: string[] = excludePrivateDirs(scannedPaths),
    clientPath: string = join(o, c.CLIENT),
    serverPath: string = join(o, c.SERVER),
    { clientCode, serverCode, clientEntries }: ReturnType<typeof generateRoutes> = generateRoutes({
      filePaths,
      options: { baseDir: toRelative(clientPath, d), pageFile, extensions },
      basePath
    })

  writeIfChanged({ path: clientPath, content: clientCode })

  if (serverCode !== null) writeIfChanged({ path: serverPath, content: serverCode })
  else if (existsSync(serverPath)) rmSync(serverPath)

  if (entries) {
    const entriesDir: string = join(o, c.ENTRIES)
    rmSync(entriesDir, { force: true, recursive: true })
    mkdirSync(entriesDir, { recursive: true })

    const clientLayoutFiles: Map<string, string> = getFiles({
      filePaths,
      expectedType: fileNames.LAYOUT,
      extensions: extensions ?? EXTENSIONS
    })

    for (const { name, src, spaRouterName } of clientEntries) {
      const entryPath: string = join(entriesDir, `${name}${extname(src)}`),
        layoutSrc: string | null = findClosestDir(src, clientLayoutFiles)?.value ?? null

      writeFileSync(
        entryPath,
        emitClientEntry({
          layoutSpecifier: layoutSrc ? toRelative(entryPath, join(d, layoutSrc)) : null,
          pageSpecifier: toRelative(entryPath, join(d, src)),
          spaRouter: spaRouterName
            ? { name: spaRouterName, specifier: toRelative(entryPath, clientPath) }
            : null,
          code: readFileSync(join(d, src), 'utf8')
        })
      )
    }
  }
}
