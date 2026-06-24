#!/usr/bin/env node
import { configRoutes } from './config'
import { configDefaults, exitCodes } from './constants'

/** @remarks Removes the runtime and script paths. */
const args: string[] = process.argv.slice(2),
  help: string = `
    fics-routes — generate routes.gen.ts from a file-based pages directory

    Usage:
      fics-routes [options]

    Options:
      --dir <path>      Pages directory to scan (default: ${configDefaults.DIR})
      --output <path>   File to write the generated module to (default: ${configDefaults.OUTPUT})
      -h, --help        Show this help and exit
  `.trim(),
  die = (message: string): never => {
    process.stderr.write(`fics-routes: ${message}\n`)
    process.exit(exitCodes.FAILURE)
  },
  options: { dir?: string; output?: string } = {}

for (let i = 0; i < args.length; ) {
  const raw: string = args[i]
  if (raw === '-h' || raw === '--help') {
    process.stdout.write(help)
    process.exit(exitCodes.SUCCESS)
  }

  const equal: number = raw.indexOf('='),
    hasEqual: boolean = equal >= 0,
    flag: string = hasEqual ? raw.slice(0, equal) : raw

  if (flag !== '--dir' && flag !== '--output')
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

try {
  configRoutes(options)
} catch (error) {
  die((error as Error).message)
}
