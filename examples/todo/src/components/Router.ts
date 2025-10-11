import { ficsRouter } from 'ficsjs/router'
import { calc, cssVar, flexCenter, oklch } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import Task from '@/components/Task'
import NotFound from '@/components/NotFound'
import { $tasks } from '@/stores'
import type { Lang, Task as TaskType } from '@/types'
import { breakpoints, measureOffsetWidth } from '@/utils/others'

const xs = calc(`${cssVar('xs')} * -1`)

export default ficsRouter<{ lang: Lang; tasks: TaskType[] }>({
  children: [Tasks, Task, NotFound],
  data: () => ({ lang: 'en', tasks: [] }),
  props: [
    {
      descendant: ({ children: { tasks, task, notFound } }) => [tasks, task, notFound],
      values: () => ({ lang: ({ getData }) => getData('lang') })
    },
    {
      descendant: ({ children: { tasks } }) => tasks,
      values: ({ setData }) => ({
        tasks: ({ getData }) => getData('tasks'),
        setTasks: (tasks: TaskType[]) => setData('tasks', tasks)
      })
    },
    {
      descendant: ({ children: { task } }) => task,
      values: ({ setData }) => ({ updateTasks: (tasks: TaskType[]) => setData('tasks', tasks) })
    }
  ],
  pages: [
    {
      path: '/',
      content: ({
        data: {
          queries: { id }
        },
        children: { tasks, task },
        template
      }) => (id ? (measureOffsetWidth() ? template`${tasks}${task}` : task) : tasks)
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
  },
  hooks: { mounted: async ({ setData }) => setData('tasks', await $tasks.get()) }
})
