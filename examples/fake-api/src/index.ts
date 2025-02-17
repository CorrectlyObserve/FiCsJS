import { Hono } from 'hono'

const app = new Hono()

app.get('/', c => {
  return c.text('Hello Hono!')
})

app.get('/photos', c => {
  return c.text('Hello Photos!')
})

export default {
  port: 5174,
  fetch: app.fetch
}
