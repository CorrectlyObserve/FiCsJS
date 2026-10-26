import Home from '@/pages/index/Home'

export const meta = {
  title: 'FiCsJS on Bun',
  description: 'This is an example of FiCsJS for SSR / SSG.'
}

export default async (): Promise<string> => Home.toString()
