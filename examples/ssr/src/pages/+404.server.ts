import StatusError from '@/pages/StatusError'

export const noScript = true
export const prerender = true

export const meta = {
  title: '404 \u2014 Not Found',
  description: 'The page you requested could not be found.'
}

export default (): string => StatusError.toString({ data: { description: meta.description } })
