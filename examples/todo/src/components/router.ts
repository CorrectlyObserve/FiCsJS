import { ficsRouter } from 'ficsjs/router'
import TopPage from '@/components/topPage'
import TodoApp from '@/components/todoApp'
import TodoDetail from '@/components/todoDetail'
import NotFound from '@/components/notFound'

export default async (lang: string) => {
  const notFound = await NotFound(lang)

  return ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => TopPage() },
      { path: ['/todo', `/${lang}/todo`], content: () => TodoApp() },
      { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => TodoDetail() }
    ],
    notFound: { content: () => notFound }
  })
}
