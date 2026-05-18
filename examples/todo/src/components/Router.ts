import { ficsRouter, goto } from 'ficsjs/router'
import { cssVar, flexCenter, oklch, size } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import TaskDetail from '@/components/TaskDetails'
import NotFound from '@/components/NotFound'
import { getAllTasks, getTask } from '@/stores'
import type { Task as TaskType } from '@/types'
import type { Lang } from '@/utils/lang'
import { breakpoints, measureOffsetWidth } from '@/utils/others'

export default ficsRouter<{ lang: Lang; tasks: TaskType[]; taskId: number; draft?: TaskType }>({
  children: [Tasks, TaskDetail, NotFound],
  data: () => ({ lang: 'en', tasks: [], taskId: NaN, draft: undefined }),
  props: [
    {
      descendant: ({ children: { tasks, taskDetails, notFound } }) => [
        tasks,
        taskDetails,
        notFound,
        ...[tasks, taskDetails, notFound].map(({ getChildren }) => getChildren().loading)
      ],
      values: ({ data: { lang } }) => ({ lang })
    },
    {
      descendant: ({ children: { tasks } }) => tasks,
      values: ({ data }) => ({
        tasks: data.tasks,
        taskId: data.taskId,
        setTasks: (tasks: TaskType[]) => (data.tasks = tasks)
      })
    },
    {
      descendant: ({ children: { taskDetails } }) => taskDetails,
      values: ({ data }) => ({
        draft: data.draft,
        editTask: (value: Partial<TaskType>) => {
          if (!data.draft) return
          data.draft = { ...data.draft, ...value }
        },
        updateTasks: (tasks: TaskType[]) => (data.tasks = tasks)
      })
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
  css: ({ cssToString }) => {
    const shadowColor = oklch(cssVar('black'), { darker: 0.3 })
    return `
      :host {
        ${cssToString(flexCenter('x'))}
        position: absolute;
        container-type: inline-size;
        gap: ${size(8)};
        width: 100%;
        min-height: ${cssVar('min-height')};

        @container (width >= ${breakpoints.LG}) {
          .tasks + .task-details {
            padding-inline-start: ${size(8)};
            box-shadow: ${size(-2)} 0px ${size(2)} ${size(-2)} ${shadowColor};
          }
        }
      }
    `
  },
  hooks: {
    mounted: async ({ data }) => (data.tasks = await getAllTasks()),
    updated: {
      pathname: async ({ data }) => {
        const _pathname = data.pathname.replace(/^\//, '')
        if (_pathname === '') return

        const id = parseInt(_pathname)
        if (!Number.isInteger(id)) return (data.pathname = '/404')

        const task: TaskType | undefined = getTask(await getAllTasks(), id)
        if (!task) return goto('/404', { isWithoutHistory: true })

        data.draft = task
      },
      queries: async ({ data }) => {
        const { taskId } = data.queries
        if (!taskId) return

        const id = parseInt(taskId)
        if (!Number.isInteger(id)) return goto('/404', { isWithoutHistory: true })

        data.queries = { ...data.queries, taskId: id.toString() }

        const task: TaskType | undefined = getTask(await getAllTasks(), id)
        if (!task) return goto('/404', { isWithoutHistory: true })

        data.draft = task
      },
      tasks: ({ data }) => {
        const { tasks, draft } = data
        if (!draft) return

        const { id: taskId, updatedAt } = draft,
          updatedDraft = tasks.find(({ id }) => id === taskId)

        if (updatedDraft && updatedDraft.updatedAt !== updatedAt) data.draft = updatedDraft
      }
    }
  }
})
