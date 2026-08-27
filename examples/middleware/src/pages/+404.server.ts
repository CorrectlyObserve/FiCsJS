import StatusError from '@/pages/StatusError'

export const meta = {
  title: '404 - Not Found',
  description: 'The page you requested could not be found.'
}

export default (): string => StatusError.toString({ data: { description: meta.description } })
