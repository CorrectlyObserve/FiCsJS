import { ficsRouter } from 'ficsjs/router'
import TopPage from '@/components/topPage'
import NotFound from '@/components/notFound'

export default (lang: string) =>
  ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => TopPage() },
      { path: ['/todo', `/${lang}/todo`], content: ({ $template }) => $template`` }
    ],
    notFound: { content: () => NotFound() }
  })