import type { Routing, Rpc } from './../types'
import { config } from './constants'
import { generateRoutes } from './route'
import { toAbsolute, toPosix, toRelative } from './helpers'
import { generateRpcs } from './rpc'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const {
    rpc: { CLIENT, SERVER }
  } = config,
  writeIfChanged = (path: string, content: string): boolean => {
    const prevContent: string | null = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (prevContent === content) return false

    writeFileSync(path, content)
    return true
  }

export const configRoutes = (config: Routing.Config = {}): boolean => {
  const { dir, output, pageFile, extensions, basePath }: Routing.Config = config,
    { dir: _dir, output: _output }: { dir: string; output: string } = toAbsolute({ dir, output })

  if (!existsSync(_dir)) throw new Error(`The directory "${_dir}" does not exist...`)

  const filePaths: string[] = [],
    scan = (current: string): void => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const joined: string = join(current, entry.name)

        if (entry.isDirectory()) scan(joined)
        else if (entry.isFile()) filePaths.push(toPosix(relative(_dir, joined)))
      }
    }

  scan(_dir)

  const options: Routing.Options.Generate = {
      baseDir: toRelative(_output, _dir),
      pageFile,
      extensions
    },
    outputDir: string = dirname(_output),
    { client, server }: Rpc.Generated = generateRpcs({ filePaths, options, basePath }) ?? {
      client: '',
      server: ''
    }

  if (client && server) {
    writeIfChanged(join(outputDir, CLIENT), client)
    writeIfChanged(join(outputDir, SERVER), server)
  }

  return writeIfChanged(_output, generateRoutes(filePaths, options))
}
