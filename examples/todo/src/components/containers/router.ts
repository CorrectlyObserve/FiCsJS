import { ficsRouter } from 'ficsjs/router'
import topPage from '@/components/presentations/topPage'
import tasks from '@/components/containers/tasks'
import taskDetail from '@/components/containers/taskDetail'
import notFound from '@/components/presentations/notFound'

export default (lang: string) =>
  ficsRouter({
    pages: [
      { path: ['/', `/${lang}`], content: () => topPage },
      { path: ['/todo', `/${lang}/todo`], content: () => tasks },
      { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => taskDetail }
    ],
    notFound: { content: () => notFound },
    props: {
      descendant: [topPage, tasks, taskDetail, notFound],
      values: { key: 'lang', content: () => lang }
    }
  })
