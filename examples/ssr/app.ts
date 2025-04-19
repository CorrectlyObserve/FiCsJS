import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import Users from './src/components/Users'
import Footer from './src/components/Footer'
import Photos from './src/components/Photos'

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
        <link rel="stylesheet" type="text/css" href="./dist/global.css" />
      </head>
      <body>
        ${content}
        <script type="module" src="./dist${path}.js"></script>
      </body>
    </html>
  `

const users = Users()
const footer = Footer()
app.get('/', c =>
  c.html(
    template({
      title: 'FiCsJS with Hono',
      description: 'This is a simple example of FiCsJS with Hono in SSR.',
      content: `
        <a href="/scroll">Go to the scroll page</a>
        ${users.toString()}
        ${footer.toString()}
      `,
      path: '/index'
    })
  )
)

const photos = Photos()
app.get('/scroll', c =>
  c.html(
    template({
      title: 'Infinite and virtual scroll',
      description:
        'This is a simple example of an infinite scroll and a virtual scroll with FiCsJS.',
      content: `
        <a href="/">Back to the top page</a>
        ${photos.toString()}
        ${footer.toString()}
      `,
      path: '/scroll'
    })
  )
)

export default { port: 5174, fetch: app.fetch }
