import { ficsRouter } from '@ficsjs/router'
import Top from '@/components/top'
import NotFound from '@/components/notFound'

const Router = (lang: string) =>
  ficsRouter({
    pages: [
      { paths: ['/', `/${lang}`], content: () => Top() },
      { paths: ['/todo', `/${lang}/todo`], content: ({ $template }) => $template`` }
    ],
    notFound: { content: () => NotFound() }
  })

export default Router
