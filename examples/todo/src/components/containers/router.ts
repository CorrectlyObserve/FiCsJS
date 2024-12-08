import { ficsRouter } from 'ficsjs/router'
import topPage from '@/components/presentations/topPage'
import tasks from '@/components/containers/tasks'
import task from '@/components/containers/task'
import notFound from '@/components/presentations/notFound'

export const router = ficsRouter({
  pages: [
    { path: '/', content: () => topPage },
    { path: '/todo', content: () => tasks },
    { path: '/todo/:id', content: () => task }
  ],
  notFound: { content: () => notFound },
  props: {
    descendant: [topPage, tasks, task, notFound],
    values: { key: 'lang', content: ({ $data: { lang } }) => lang }
  }
})
