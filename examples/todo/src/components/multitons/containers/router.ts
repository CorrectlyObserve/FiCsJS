import { ficsRouter } from 'ficsjs/router'
import topPage from '@/components/singletons/topPage'
import tasks from '@/components/singletons/tasks'
import task from '@/components/singletons/task'
import notFound from '@/components/multitons/containers/notFound'

export default ficsRouter({
  pages: [
    { path: '/', content: () => topPage },
    { path: '/todo', content: () => tasks },
    { path: '/todo/:id', content: () => task }
  ],
  notFound: { content: () => notFound },
  props: [
    {
      descendant: [topPage, tasks, task, notFound],
      values: ({ getData }) => ({ lang: getData('lang') })
    }
  ]
})
