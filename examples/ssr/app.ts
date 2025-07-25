import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { serveStatic } from '@hono/node-server/serve-static'
import Link from './src/components/materials/Link'
import Users from './src/components/Users'
import ChatButton from './src/components/ChatButton'
import Photos from './src/components/Photos'
import Tab from './src/components/Tab'
import Router from './src/components/Router'

const app = new Hono()

app.get('/dist/*', serveStatic({ root: './' }))

const template = ({
  title,
  description,
  content,
  path
}: {
  title: string
  description: string
  content: string
  path: string
}): string =>
  `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link rel="stylesheet" type="text/css" href="/dist/global.css" />
      </head>
      <body class="bg-dark px-4">
        <header class="py-2"><h1 class="text-xl text-center font-semibold">${title}</h1></header>
        <main class="pb-8">${content}</main>
        <footer class="text-sm text-white text-center pb-4"><p>&copy; 2025 Masami Ogasawara</p></footer>
        <script type="module" src="/dist/${path}.js"></script>
      </body>
    </html>
  `

const link = Link()
app.get('/', c =>
  c.html(
    template({
      title: 'FiCsJS with Hono',
      description: 'This is a simple example of FiCsJS with Hono in SSR.',
      content: `
        ${link.toString({ href: '/scroll', text: 'Go to the scroll page' })}
        ${Users.toString()}
        ${ChatButton.toString()}
      `,
      path: '/index'
    })
  )
)

app.get('/scroll', c =>
  c.html(
    template({
      title: 'Infinite and virtual scroll',
      description:
        'This is a simple example of an infinite scroll and a virtual scroll with FiCsJS.',
      content: `
        ${link.toString({ href: '/', text: 'Back to the top page' })}
        ${Photos.toString()}
        ${ChatButton.toString()}
      `,
      path: '/scroll'
    })
  )
)

app.get('/chat', c =>
  c.html(
    template({
      title: 'WebSocket and SSE',
      description: 'This is a simple example of a WebSocket and an SSE with FiCsJS.',
      content: `
        ${link.toString({ href: '/', text: 'Back to the top page' })}
        ${Tab.toString()}
        ${Router.toString()}
      `,
      path: '/chat'
    })
  )
)

app.get('/chat/tab', c =>
  c.html(
    template({
      title: 'WebSocket and SSE',
      description: 'This is a simple example of a WebSocket and an SSE with FiCsJS.',
      content: `
        ${link.toString({ href: '/', text: 'Back to the top page' })}
        ${Tab.toString()}
        ${Router.toString()}
      `,
      path: '/chat'
    })
  )
)

let id = 0

app.get('/sse', async c => {
  return streamSSE(c, async stream => {
    while (true) {
      const message = `It is ${new Date().toISOString()}`
      await stream.writeSSE({
        data: message,
        event: 'time-update',
        id: String(id++)
      })
      await stream.sleep(1000)
    }
  })
})

export default { port: 5174, fetch: app.fetch }
