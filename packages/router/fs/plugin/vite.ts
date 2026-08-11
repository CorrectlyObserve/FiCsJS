import { CONTENT_TYPE } from '../../../core/helpers'
import { statusCodes } from '../../constants'
import type { Routing, Vite } from '../../types'
import { configRoutes } from '../config'
import { config as configConstants, MODULE_EXT_REGEX, ROUTER_CALL_REGEX } from '../constants'
import { readIfExists } from '../file'
import { joinLines, toAbsolute, toRelative } from '../helpers'
import { generateEntryHtml } from './entryHtml'
import { existsSync, renameSync, rmdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

export const vitePlugin = (config: Routing.Config & { watch?: boolean } = {}): Vite.Plugin => {
  const { dir, output }: { dir: string; output: string } = toAbsolute({
      dir: config.dir,
      output: config.output
    }),
    ficsDir: string = dirname(output),
    clientPath: string = join(output, configConstants.CLIENT)

  let root: string = process.cwd(),
    outDir: string = 'dist',
    entry: string | null = null

  return {
    name: configConstants.TOOL_NAME,
    enforce: 'pre',
    config(): {
      resolve: { alias: Record<string, string> }
      build?: { rollupOptions: { input: string } }
    } {
      entry = generateEntryHtml({ root, output })
      return {
        resolve: { alias: { [configConstants.ALIAS]: ficsDir } },
        ...(entry ? { build: { rollupOptions: { input: entry } } } : {})
      }
    },
    configResolved(resolved: { root: string; build: { outDir: string } }): void {
      root = resolved.root
      outDir = resolved.build.outDir
      entry = generateEntryHtml({ root, output })
    },
    configureServer(server: Vite.DevServer): void {
      if (config.watch ?? true) server.watcher.add(dir)
      if (entry === null) return

      server.middlewares.use(async (req, res, next) => {
        const url: string = req.url ?? '/',
          cleanedUrl: string = url.split('?')[0]

        /** @remarks The handleHotUpdate function may set entry to null. */
        if ((cleanedUrl !== '/' && cleanedUrl !== '/index.html') || entry === null) return next()

        const template: string | null = readIfExists(entry)
        if (template === null) return next()

        try {
          const html: string = await server.transformIndexHtml(url, template, req.originalUrl)
          res.statusCode = statusCodes.OK
          res.setHeader(CONTENT_TYPE, 'text/html')
          res.end(html)
        } catch (error) {
          next(error)
        }
      })
    },
    buildStart(): void {
      configRoutes(config)
    },
    transform(code: string, id: string): { code: string; map: null } | null {
      const cleanedId: string = id.split('?')[0]

      if (!MODULE_EXT_REGEX.test(cleanedId) || cleanedId.includes('/node_modules/')) return null
      if (toAbsolute({ cleanedId }).cleanedId === clientPath) return null
      if (!ROUTER_CALL_REGEX.test(code)) return null

      const relativeId: string = toRelative(cleanedId, clientPath).replace(MODULE_EXT_REGEX, '')
      if (code.includes(`'${relativeId}'`) || code.includes(`"${relativeId}"`)) return null

      return { code: joinLines([`import '${relativeId}';`, code]), map: null }
    },
    writeBundle(): void {
      if (entry === null) return

      const outAbs: string = resolve(root, outDir),
        built: string = join(outAbs, relative(root, entry))

      if (existsSync(built)) {
        renameSync(built, join(outAbs, 'index.html'))

        try {
          rmdirSync(dirname(built))
        } catch {
          /** @remarks ignores intentionally as .fics dir is not empty and can safely be left behind. */
        }
      }
    },
    handleHotUpdate({ file }: { file: string }): void {
      if (file.startsWith(dir)) configRoutes(config)
      if (file === join(root, 'app.html')) entry = generateEntryHtml({ root, output })
    }
  } as const
}
