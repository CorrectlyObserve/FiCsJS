import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

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
        <script src="./dist${path}.js"></script>
      </body>
    </html>
  `

app.get('/', c =>
  c.html(
    template({
      title: 'Home',
      description: 'Home page',
      content: `
        <h1 class="flex justify-center items-center">Hello, Hono!</h1>
      `,
      path: '/top'
    })
  )
)

app.get('/photos', c =>
  c.html(
    template({
      title: 'Home',
      description: 'Home page',
      content: `
        <h1 class="flex justify-center items-center">Hello, Hono!</h1>
      `,
      path: '/photos'
    })
  )
)

export default { port: 5174, fetch: app.fetch }
