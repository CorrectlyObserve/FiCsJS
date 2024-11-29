import { ficsRouter } from 'ficsjs/router'
import { getState } from 'ficsjs/state'
import topPage from '@/components/presentations/topPage'
import tasks from '@/components/containers/tasks'
import taskDetail from '@/components/containers/taskDetail'
import notFound from '@/components/presentations/notFound'
import { $lang } from '@/store'

const lang = getState<string>($lang)

export default ficsRouter({
  pages: [
    { path: ['/', `/${lang}`], content: () => topPage },
    { path: ['/todo', `/${lang}/todo`], content: () => tasks },
    { path: ['/todo/:id', `/${lang}/todo/:id`], content: () => taskDetail }
  ],
  notFound: { content: () => notFound },
  props: { descendant: [topPage, notFound], values: { key: 'lang', content: () => lang } }
})
