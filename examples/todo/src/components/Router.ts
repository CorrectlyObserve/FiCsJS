import { ficsRouter, goto } from 'ficsjs/router'
import { calc, cssVar, flexCenter, oklch } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import TaskDetail from '@/components/TaskDetail'
import NotFound from '@/components/NotFound'
import { getAllTasks, getTask } from '@/stores'
import type { Lang, Task as TaskType } from '@/types'
import { breakpoints, measureOffsetWidth } from '@/utils/others'

const xs = calc(`${cssVar('xs')} * -1`)

export default ficsRouter<{ lang: Lang; tasks: TaskType[]; draft: TaskType | undefined }>({
  children: [Tasks, TaskDetail, NotFound],
  data: () => ({ lang: 'en', tasks: [], draft: undefined }),
  props: [
    {
      descendant: ({ children: { tasks, taskDetail, notFound } }) => [tasks, taskDetail, notFound],
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
      descendant: ({ children: { taskDetail } }) => taskDetail,
      values: ({ setData }) => ({
        draft: ({ getData }) => getData('draft'),
        editTask:
          ({ getData }) =>
          (newValue: Partial<TaskType>) => {
            const draft: TaskType | undefined = getData('draft')
            if (!draft) return

            setData('draft', { ...draft, ...newValue })
          },
        getTask:
          ({ getData }) =>
          () =>
            getData('draft'),
        updateTasks: (tasks: TaskType[]) => setData('tasks', tasks)
      })
    },
    {
      descendant: ({ children: { taskDetail } }) => taskDetail.getChildren().input,
      values: () => ({
        isError: ({ getData }) => getData('draft')?.title === '',
        value: ({ getData }) => getData('draft')?.title
      })
    },
    {
      descendant: ({ children: { taskDetail } }) => taskDetail.getChildren().textarea,
      values: () => ({ value: ({ getData }) => getData('draft')?.description })
    },
    {
      descendant: ({ children: { taskDetail } }) => taskDetail.getChildren().button,
      values: () => ({ isDisabled: ({ getData }) => getData('draft')?.title === '' })
    }
  ],
  pages: [
    {
      path: '/',
      content: ({
        children: { tasks, taskDetail },
        data: {
          queries: { taskId }
        },
        template
      }) => {
        if (taskId) return measureOffsetWidth() ? template`${tasks}${taskDetail}` : taskDetail
        return tasks
      }
    },
    { path: '/:taskId', content: ({ children: { taskDetail } }) => taskDetail },
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
        '.tasks + .task-detail': {
          paddingLeft: cssVar('xl'),
          boxShadow: `${xs} 0px ${cssVar('xs')} ${xs} ${oklch(cssVar('black'), { darker: 0.3 })}`
        }
      }
    }
  },
  hooks: {
    mounted: async ({ setData }) => setData('tasks', await getAllTasks()),
    updated: {
      pathname: async ({ data: { pathname }, setData }) => {
        pathname = pathname.replace(/^\//, '')
        if (pathname === '') return

        const id = parseInt(pathname)
        if (!Number.isFinite(id)) return setData('pathname', '/404')

        const task: TaskType | undefined = await getTask(await getAllTasks(), id)
        if (!task) return goto('/404', true)

        setData('draft', task)
      },
      queries: async ({
        data: {
          queries: { taskId }
        },
        setData
      }) => {
        if (!taskId) return

        const id = parseInt(taskId)
        if (!Number.isFinite(id)) return goto('/404', true)

        const task: TaskType | undefined = await getTask(await getAllTasks(), id)
        if (!task) return goto('/404', true)

        setData('draft', task)
      }
    }
  }
})
