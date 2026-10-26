import { configGlobalCss } from 'ficsjs'
import type { FiCsRouter } from 'ficsjs/router/server-only'
import globalCss from '@/global'
import { THEME_KEY } from '@/domain/theme'
import Header from '@/pages/Header'
import { getSessionUser } from '@/server/session'

configGlobalCss(globalCss)

const applyTheme = (key: string): void => {
  try {
    const theme: string | undefined = JSON.parse(sessionStorage.getItem(key) ?? 'null')?.data
    if (theme) document.documentElement.dataset.theme = theme
  } catch {}
}

export const render = ({
  meta: { title },
  content,
  script,
  ctx: { req }
}: FiCsRouter.Render): string => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script>(${applyTheme})('${THEME_KEY}')</script>
    </head>
    <body>
      ${Header.toString({ data: { userName: getSessionUser(req)?.name ?? null } })}
      <main>
        ${(script !== '/assets/index.js' && `<h2>${title}</h2>`) || ''}
        ${content}
      </main>
      <footer><p>&copy; 2025 Masami Ogasawara</p></footer>
      ${script && `<script type="module" src="${script}"></script>`}
    </body>
  </html>
`
