import { configGlobalCss } from 'ficsjs'
import type { FiCsRouter } from 'ficsjs/router/server-only'
import globalCss from '@/global'
import Header from '@/pages/Header'
import { getSessionUser } from '@/server/session'

configGlobalCss(globalCss)

export const render = ({ meta, content, script }: FiCsRouter.Render): string => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      ${Header.toString({
        data: { title: title ?? '', userName: getSessionUser(req)?.name ?? null }
      })}
      <main>${content}</main>
      <footer><p>&copy; 2025 Masami Ogasawara</p></footer>
      ${script && `<script type="module" src="${script}"></script>`}
    </body>
  </html>
`
