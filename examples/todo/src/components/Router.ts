import { ficsRouter } from 'ficsjs/router'
import { calc, cssVar, flexCenter, oklch } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import Task from '@/components/Task'
import NotFound from '@/components/NotFound'
import type { Lang } from '@/types'
import { breakpoints, measureOffsetWidth } from '@/utils/others'

const xs = calc(`${cssVar('xs')} * -1`)

export default ficsRouter<{ lang: Lang }>({
  children: [Tasks, Task, NotFound],
  data: () => ({ lang: 'en' }),
  props: {
    descendant: ({ children: { tasks, task, notFound } }) => [tasks, task, notFound],
    values: ({}) => ({ lang: ({ getData }) => getData('lang') })
  },
  pages: [
    {
      path: '/',
      content: ({
        data: {
          queries: { id }
        },
        children: { tasks, task },
        template
      }) => (id ? (measureOffsetWidth() ? template`${Tasks}${task}` : task) : Tasks)
    },
    { path: '/:id', content: ({ children: { task } }) => task },
    { path: '/redirect', redirect: '/' }
  ],
  notFound: { content: ({ children: { notFound } }) => notFound },
  css: {
    ':host': {
      ...flexCenter('x'),
      position: 'absolute',
      containerType: 'inline-size',
      gap: cssVar('xl'),
      width: '100%',
      minHeight: cssVar('min-height'),
      [`@container (width >= ${breakpoints.lg})`]: {
        '.task': {
          paddingLeft: cssVar('xl'),
          boxShadow: `${xs} 0px ${cssVar('xs')} ${xs} ${oklch(cssVar('black'), { darker: 0.3 })}`
        }
      }
    }
  }
})
