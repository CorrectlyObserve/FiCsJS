#!/usr/bin/env node
import { RPC_BASE_PATH } from '../constants'
import type { Routing } from '../types'
import { configRoutes } from './config'
import { config, exitCodes } from './constants'
import { indent, joinLines } from './helpers'

/** @remarks Removes the runtime and script paths. */
const args: string[] = process.argv.slice(2),
  help: string = joinLines([
    'fics-routes — generate routes.gen.ts from a file-based pages directory',
    '',
    'Usage:',
    `${indent()}fics-routes [options]`,
    '',
    'Options:',
    `${indent()}--dir <path>       Pages directory to scan (default: ${config.DIR})`,
    `${indent()}--output <path>    File to write the generated module to (default: ${config.OUTPUT})`,
    `${indent()}--basePath <path>  RPC URL prefix baked into the client & handler (default: ${RPC_BASE_PATH})`,
    `${indent()}-h, --help         Show this help and exit`
  ]),
  die = (message: string): never => {
    process.stderr.write(`fics-routes: ${message}\n`)
    process.exit(exitCodes.FAILURE)
  },
  options: Omit<Routing.Config, 'pageFile' | 'extensions'> & { entries?: boolean } = {}

for (let i = 0; i < args.length; ) {
  const raw: string = args[i]
  if (raw === '-h' || raw === '--help') {
    process.stdout.write(help)
    process.exit(exitCodes.SUCCESS)
  }

  const equal: number = raw.indexOf('='),
    hasEqual: boolean = equal >= 0,
    flag: string = hasEqual ? raw.slice(0, equal) : raw

  if (flag !== '--dir' && flag !== '--output' && flag !== '--basePath')
    die(`The argument "${raw}" is not recognized — try --help...`)

  let inline: string | undefined = hasEqual ? raw.slice(equal + 1) : undefined
  if (inline === undefined) {
    const next: string | undefined = args[++i]

    if (next === undefined || next.startsWith('-'))
      die(`The flag "${flag}" requires a value (${next ? `got "${next}"` : 'missing'})...`)

    inline = next
  }

  if (inline === '') die(`The flag "${flag}" requires a value (empty)...`)

  options[flag.slice('--'.length) as keyof typeof options] = inline
  i++
}

if (options.basePath !== undefined && !options.basePath.startsWith('/'))
  die(`The --basePath must start with "/" (got "${options.basePath}")...`)

try {
  configRoutes(options)
} catch (error) {
  die((error as Error).message)
}
