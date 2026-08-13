import { ROUTER_COMPONENT_NAME } from '../../constants'
import { config } from '../constants'
import { readIfExists, writeIfChanged } from '../file'
import { indent, joinLines, removeExt } from '../helpers'
import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const rootLines = (importPath: string): string[] => [
    `<f-${ROUTER_COMPONENT_NAME}></f-${ROUTER_COMPONENT_NAME}>`,
    '<script type="module">',
    `${indent()}import { Router } from '${importPath}'`,
    `${indent()}Router.describe()`,
    '</script>'
  ],
  renderRoot = (importPath: string, indentation: string): string =>
    joinLines(rootLines(importPath).map(line => `${indentation}${line}`))

const defaultTemplate = (importPath: string): string =>
    joinLines([
      '<!doctype html>',
      '<html>',
      `${indent()}<head>`,
      `${indent(2)}<meta charset="UTF-8" />`,
      `${indent(2)}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      `${indent(2)}<title></title>`,
      `${indent()}</head>`,
      `${indent()}<body>`,
      renderRoot(importPath, indent(2)),
      `${indent()}</body>`,
      '</html>',
      ''
    ]),
  injectHtml = ({ html, importPath }: { html: string; importPath: string }): string => {
    const withMarker: string = html.replace(
      new RegExp('([\\x20\\t]*)<!-- fics:root -->'),
      (_, indentation) => renderRoot(importPath, indentation)
    )
    if (withMarker !== html) return withMarker

    const withBody: string = html.replace(/([\x20\t]*)<\/body>/, (_, indentation) =>
      joinLines([renderRoot(importPath, `${indentation}${indent()}`), `${indentation}</body>`])
    )
    if (withBody !== html) return withBody

    return joinLines([html.trimEnd(), renderRoot(importPath, ''), ''])
  }

export const generateEntryHtml = ({
  root,
  output
}: {
  root: string
  output: string
}): string | null => {
  const appHtml: string | null = readIfExists(join(root, 'app.html'))

  if (appHtml === null && existsSync(join(root, 'index.html'))) return null

  const entry: string = join(dirname(output), 'index.html'),
    importPath: string = [config.ALIAS, basename(output), removeExt(config.CLIENT)].join('/')

  writeIfChanged({
    path: entry,
    content:
      appHtml === null ? defaultTemplate(importPath) : injectHtml({ html: appHtml, importPath })
  })

  return entry
}
