import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

app.get('/dist/*', serveStatic({ root: './' }))

app.get('/', c => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hono Page</title>
        <link rel="stylesheet" type="text/css" href="./dist/global.css" />
      </head>
      <body>
        <h1 class="flex justify-center items-center">Hello, Hono!</h1>
        <script src="./dist/index.js"></script>
      </body>
    </html>
  `)
})

app.get('/photos', c => {
  return c.text('Hello Photos!')
})

export default {
  port: 5174,
  fetch: app.fetch
}
