import { ficsRouter, goto } from 'ficsjs/router'
import { calc, cssVar, flexCenter, oklch } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import TaskDetail from '@/components/TaskDetails'
import NotFound from '@/components/NotFound'
import { getAllTasks, getTask } from '@/stores'
import type { Lang, Task as TaskType } from '@/types'
import { breakpoints, measureOffsetWidth } from '@/utils/others'

interface Data {
  lang: Lang
  tasks: TaskType[]
  taskId: number
  draft: TaskType | undefined
}

const xs = calc(`${cssVar('xs')} * -1`)

export default ficsRouter<Data>({
  children: [Tasks, TaskDetail, NotFound],
  data: () => ({ lang: 'en', tasks: [], taskId: NaN, draft: undefined }),
  props: [
    {
      descendant: ({ children: { tasks, taskDetails, notFound } }) => [
        tasks,
        taskDetails,
        notFound
      ],
      values: () => ({ lang: ({ getData }) => getData('lang') })
    },
    {
      descendant: ({ children: { tasks } }) => tasks,
      values: ({ setData }) => ({
        tasks: ({ getData }) => getData('tasks'),
        taskId: ({ getData }) => getData('taskId'),
        setTasks: (tasks: TaskType[]) => setData('tasks', tasks)
      })
    },
    {
      descendant: ({ children: { taskDetails } }) => taskDetails,
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
      descendant: ({ children: { taskDetails } }) => taskDetails.getChildren().input,
      values: () => ({
        isError: ({ getData }) => getData('draft')?.title === '',
        value: ({ getData }) => getData('draft')?.title
      })
    },
    {
      descendant: ({ children: { taskDetails } }) => taskDetails.getChildren().textarea,
      values: () => ({ value: ({ getData }) => getData('draft')?.description })
    },
    {
      descendant: ({ children: { taskDetails } }) => taskDetails.getChildren().button,
      values: () => ({ isDisabled: ({ getData }) => getData('draft')?.title === '' })
    }
  ],
  pages: [
    {
      path: '/',
      content: ({
        children: { tasks, taskDetails },
        data: {
          queries: { taskId }
        },
        template
      }) => {
        if (taskId) return measureOffsetWidth() ? template`${tasks}${taskDetails}` : taskDetails
        return tasks
      }
    },
    { path: '/:taskId', content: ({ children: { taskDetails } }) => taskDetails },
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
        if (!task) return goto('/404', { isWithoutHistory: true })

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
        if (!Number.isFinite(id)) return goto('/404', { isWithoutHistory: true })

        setData('taskId', id)

        const task: TaskType | undefined = await getTask(await getAllTasks(), id)
        if (!task) return goto('/404', { isWithoutHistory: true })

        setData('draft', task)
      },
      tasks: ({ data: { tasks, draft }, setData }) => {
        if (!draft) return

        const { id, updatedAt } = draft,
          updatedDraft = tasks.find(task => task.id === id)

        if (updatedDraft && updatedDraft.updatedAt !== updatedAt) setData('draft', updatedDraft)
      }
    }
  }
})
