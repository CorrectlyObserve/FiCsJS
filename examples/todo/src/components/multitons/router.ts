import { ficsRouter } from 'ficsjs/router'
import tasks from '@/components/singletons/tasks'
import task from '@/components/singletons/task'
import notFound from '@/components/multitons/notFound'

export default ficsRouter({
  pages: [
    { path: '/', content: () => tasks },
    { path: '/:id', content: ({ template }) => template`${tasks}${task}` }
  ],
  notFound: { content: () => notFound },
  props: [
    {
      descendant: [tasks, task, notFound],
      values: () => ({ lang: ({ getData }) => getData('lang') })
    }
  ]
})
