import StatusError from '@/pages/StatusError'

export const meta = {
  title: '500 - Internal Server Error',
  description: 'Something went wrong on the server.'
}

export default ({ error }: { error?: unknown }): string =>
  StatusError.toString({
    data: {
      description: meta.description,
      message: error instanceof Error ? error.message : String(error ?? 'Unknown server error')
    }
  })
