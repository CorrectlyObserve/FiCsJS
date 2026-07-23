import type { Routing, Rpc } from '../types'
import { COMMENT, config, ENTRIES_DIR, metaExports, routerImport } from './constants'
import { joinLines, toAbsolute, toPosix, toRelative } from './helpers'
import { generateRoutes } from './route'
import { generateRpcs } from './rpc'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const { RPC_CLIENT, RPC_SERVER } = config,
  writeIfChanged = (path: string, content: string): boolean => {
    const prevContent: string | null = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (prevContent === content) return false

    writeFileSync(path, content)
    return true
  },
  buildClientEntry = ({ specifier, src }: { specifier: string; src: string }): string => {
    const arr: string[] = [COMMENT]

    if (metaExports.INLINE.test(src) || metaExports.BLOCK.test(src))
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

export const configRoutes = (config: Routing.Config = {}): boolean => {
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

  const options: Routing.Options.Generate = {
      baseDir: toRelative(o, d),
      pageFile,
      extensions
    },
    outputDir: string = dirname(o),
    { client, server }: Rpc.Generated = generateRpcs({ filePaths, options, basePath }) ?? {
      client: '',
      server: ''
    }

  if (client && server) {
    writeIfChanged(join(outputDir, RPC_CLIENT), client)
    writeIfChanged(join(outputDir, RPC_SERVER), server)
  }

  return writeIfChanged(o, generateRoutes(filePaths, options))
}
