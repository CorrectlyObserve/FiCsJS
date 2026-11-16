import { escape } from '../../../core/helpers'
import { INDEX_HTML, ROUTER_COMPONENT_NAME, VIEW_TRANSITION_STYLE } from '../../constants'
import { readIfExists, writeIfChanged } from '../../file'
import { indent, joinLines } from '../../helpers'
import { config } from '../constants'
import { removeExt } from '../helpers'
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

const defaultTemplate = ({
    title,
    viewTransition,
    importPath
  }: {
    title: string
    viewTransition: boolean
    importPath: string
  }): string =>
    joinLines([
      '<!doctype html>',
      '<html>',
      `${indent()}<head>`,
      `${indent(2)}<meta charset="UTF-8" />`,
      `${indent(2)}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      `${indent(2)}<title>${escape(title, 'text-content')}</title>`,
      ...(viewTransition ? [`${indent(2)}${VIEW_TRANSITION_STYLE}`] : []),
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
  output,
  title = '',
  viewTransition = false
}: {
  root: string
  output: string
  title?: string
  viewTransition?: boolean
}): string | null => {
  const appHtml: string | null = readIfExists(join(root, 'app.html'))

  if (appHtml === null && existsSync(join(root, INDEX_HTML))) return null

  const entry: string = join(dirname(output), INDEX_HTML),
    importPath: string = [config.ALIAS, basename(output), removeExt(config.CLIENT)].join('/')

  writeIfChanged({
    path: entry,
    content:
      appHtml === null
        ? defaultTemplate({ title, viewTransition, importPath })
        : injectHtml({
            html: viewTransition
              ? appHtml.replace(/<\/head>/i, `${VIEW_TRANSITION_STYLE}</head>`)
              : appHtml,
            importPath
          })
  })

  return entry
}
