#!/usr/bin/env node
import { isBlankString } from '../../core/helpers'
import type { SetTimeout } from '../../core/types'
import { RPC_BASE } from '../constants'
import type { Routing } from '../types'
import { configRoutes } from './config'
import { config, DEBOUNCE_DELAY_MS, exitCodes } from './constants'
import { indent, joinLines, toAbsolute } from './helpers'
import { watch as watchDir } from 'node:fs'

const { OUTPUT, SCANNED_DIR, TOOL_NAME } = config,
  /** @remarks Removes the runtime and script paths. */
  args: string[] = process.argv.slice(2),
  help: string = joinLines([
    `${TOOL_NAME} — generate the client/server barrels from a file-based pages directory`,
    '',
    'Usage:',
    `${indent()}${TOOL_NAME} [options]`,
    '',
    'Options:',
    `${indent()}--dir <path>       Pages directory to scan (default: ${SCANNED_DIR})`,
    `${indent()}--output <path>    Directory to write the generated barrels to (default: ${OUTPUT})`,
    `${indent()}--basePath <path>  RPC URL prefix baked into the client & handler (default: ${RPC_BASE})`,
    `${indent()}--entries          Emit client entry stubs to build without Vite`,
    `${indent()}--watch            Regenerate on any change under the pages directory`,
    `${indent()}-h, --help         Show this help and exit`
  ]),
  die = (message: string): never => {
    process.stderr.write(`${TOOL_NAME}: ${message}\n`)
    process.exit(exitCodes.FAILURE)
  },
  options: Omit<Routing.Config, 'pageFile' | 'extensions'> = {}

let watch: boolean = false

for (let i = 0; i < args.length; ) {
  const raw: string = args[i]
  if (raw === '-h' || raw === '--help') {
    process.stdout.write(help)
    process.exit(exitCodes.SUCCESS)
  }

  const equal: number = raw.indexOf('='),
    hasEqual: boolean = equal >= 0,
    flag: string = hasEqual ? raw.slice(0, equal) : raw

  if (flag === '--entries' || flag === '--watch') {
    if (hasEqual) die(`The flag "${flag}" takes no value...`)

    if (flag === '--entries') options.entries = true
    else watch = true

    i++
    continue
  }

  if (['--dir', '--output', '--basePath'].every(f => f !== flag))
    die(`The argument "${raw}" is not recognized — try --help...`)

  let inline: string | undefined = hasEqual ? raw.slice(equal + 1) : undefined
  if (inline === undefined) {
    const next: string | undefined = args[++i]

    if (next === undefined || next.startsWith('-'))
      die(`The flag "${flag}" requires a value (${next ? `got "${next}"` : 'missing'})...`)

    inline = next
  }

  if (isBlankString(inline)) die(`The flag "${flag}" requires a value (empty)...`)

  options[flag.slice('--'.length) as Exclude<keyof typeof options, 'entries'>] = inline
  i++
}

if (options.basePath !== undefined && !options.basePath.startsWith('/'))
  die(`The --basePath must start with "/" (got "${options.basePath}")...`)

try {
  configRoutes(options)
} catch (error) {
  die((error as Error).message)
}

if (watch) {
  const { dir }: { dir: string } = toAbsolute({ dir: options.dir })
  process.stdout.write(`${TOOL_NAME}: watching "${dir}" for changes\n`)

  /** @remarks Needs Node >= 22 for the recursive option. */
  let timer: SetTimeout | undefined
  watchDir(dir, { recursive: true }, (): void => {
    clearTimeout(timer)
    timer = setTimeout((): void => {
      try {
        configRoutes(options)
      } catch (error) {
        process.stderr.write(`${TOOL_NAME}: ${(error as Error).message}\n`)
      }
    }, DEBOUNCE_DELAY_MS)
  })
}
