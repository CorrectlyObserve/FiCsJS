import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import Footer from './src/components/Footer'
import Link from './src/components/Link'
import Users from './src/components/Users'
import Photos from './src/components/Photos'

const app = new Hono()

app.get('/dist/*', serveStatic({ root: './' }))

const footer = Footer()
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
        <link rel="stylesheet" type="text/css" href="./dist/global.css" />
      </head>
      <body class="bg-dark px-4 pb-4">
        <header class="py-2"><h1 class="text-xl text-center font-medium">${title}</h1></header>
        <main class="mb-8">${content}</main>
        ${footer.toString()}
        <script type="module" src="./dist${path}.js"></script>
      </body>
    </html>
  `

const toScrollPage = Link({ href: '/scroll', text: 'Go to the scroll page' })
const users = Users()
app.get('/', c =>
  c.html(
    template({
      title: 'FiCsJS with Hono',
      description: 'This is a simple example of FiCsJS with Hono in SSR.',
      content: `${toScrollPage.toString()}${users.toString()}`,
      path: '/index'
    })
  )
)

const toIndexPage = Link({ href: '/', text: 'Back to the top page' })
const photos = Photos()
app.get('/scroll', c =>
  c.html(
    template({
      title: 'Infinite and virtual scroll',
      description:
        'This is a simple example of an infinite scroll and a virtual scroll with FiCsJS.',
      content: `${toIndexPage.toString()}${photos.toString()}`,
      path: '/scroll'
    })
  )
)

export default { port: 5174, fetch: app.fetch }
