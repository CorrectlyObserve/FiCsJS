import type { Routing, VitePlugin } from '../types'
import { configRoutes } from './config'
import { config as configConstants, MODULE_EXT_REGEX } from './constants'
import { toAbsolute, toRelative } from './helpers'
import { dirname, join } from 'node:path'

const injectRoutes = ({
  id,
  code,
  output
}: {
  code: string
  id: string
  output: string
}): { code: string; map: null } | null => {
  const cleanedId: string = id.split('?')[0],
    isModule: boolean = MODULE_EXT_REGEX.test(cleanedId),
    isNodeModule: boolean = cleanedId.includes('/node_modules/'),
    isSameOutput: boolean = toAbsolute({ cleanedId }).cleanedId === output,
    isRouterCalled: boolean = /\bficsRouter\s*(?:<[^>]+>)?\s*\(/.test(code)

  if (!isModule || isNodeModule || isSameOutput || !isRouterCalled) return null

  const relativeId: string = toRelative(cleanedId, output).replace(MODULE_EXT_REGEX, '')
  if (code.includes(`'${relativeId}'`) || code.includes(`"${relativeId}"`)) return null

  return { code: `import '${relativeId}';\n${code}`, map: null }
}

/** @remarks Depends on Vite. */
export const viteRoutesPlugin = (config: Routing.Config & { watch?: boolean } = {}): VitePlugin => {
  const { dir, output }: { dir: string; output: string } = toAbsolute({
    dir: config.dir,
    output: config.output
  })

  return {
    name: configConstants.TOOL_NAME,
    enforce: 'pre',
    config(): {
      resolve: { alias: Record<string, string> }
      build?: { rollupOptions: { input: string } }
    } {
      entry = generateEntryHtml({ root, dir: output })
      return {
        resolve: { alias: { [configConstants.ALIAS]: ficsDir } },
        ...(entry ? { build: { rollupOptions: { input: entry } } } : {})
      }
    },
    configResolved(resolved: { root: string; build: { outDir: string } }): void {
      root = resolved.root
      outDir = resolved.build.outDir
      entry = generateEntryHtml({ root, dir: output })
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
    configureServer({ watcher }: { watcher: { add: (path: string) => void } }): void {
      if (config.watch ?? true) watcher.add(dir)
    },
    handleHotUpdate({ file }: { file: string }): void {
      if (file.startsWith(dir)) configRoutes(config)
      if (file === join(root, 'app.html')) entry = generateEntryHtml({ root, dir: output })
    },
    writeBundle(): void {
      if (!entry) return

      const outAbs: string = resolve(root, outDir),
        built: string = join(outAbs, relative(root, entry))

      if (existsSync(built)) {
        renameSync(built, join(outAbs, 'index.html'))

        try {
          rmdirSync(dirname(built))
        } catch {
          /** @remarks Please leave it as the .fics dir is not empty. */
        }
      }
    },
    transform(code: string, id: string): { code: string; map: null } | null {
      const cleanedId = id.split('?')[0]

      if (!MODULE_EXT_REGEX.test(cleanedId) || cleanedId.includes('/node_modules/')) return null
      if (toAbsolute({ cleanedId }).cleanedId === clientPath) return null
      if (!new RegExp(`\\b${ROUTER}\\s*(?:<[^>]+>)?\\s*\\(`).test(code)) return null

      const relativeId: string = toRelative(cleanedId, clientPath).replace(MODULE_EXT_REGEX, '')
      if (code.includes(`'${relativeId}'`) || code.includes(`"${relativeId}"`)) return null

      return { code: joinLines([`import '${relativeId}';`, code]), map: null }
    }
  } as const
}
