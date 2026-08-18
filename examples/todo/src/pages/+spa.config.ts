import type { FiCsRouter } from 'ficsjs/router'
import { cssVar, flexCenter, oklch, size } from 'ficsjs/style'
import Tasks from '@/components/Tasks'
import TaskDetail from '@/components/TaskDetails'
import NotFound from '@/components/NotFound'
import { $lang, getAllTasks, getTask } from '@/stores'
import type { Task as TaskType } from '@/types'
import type { Lang } from '@/utils/lang'
import { breakpoints } from '@/utils/others'

export interface Data {
  lang: Lang
  tasks: TaskType[]
  draft?: TaskType
}

const props: FiCsRouter.Props<Data> = [
  {
    descendants: ({ children: { tasks, taskDetails, notFound } }) => {
      const targets = [tasks, taskDetails, notFound]
      return [...targets, ...targets.map(child => child.getChildren().loading)]
    },
    values: ({ data: { lang } }) => ({ lang })
  },
  {
    descendants: ({ children: { tasks } }) => tasks,
    values: ({ data }) => ({
      tasks: data.tasks,
      taskId: data.taskId,
      setTasks: (tasks: TaskType[]) => (data.tasks = tasks)
    })
  },
  {
    descendants: ({ children: { taskDetails } }) => taskDetails,
    values: ({ data }) => ({
      draft: data.draft,
      editTask: (value: Partial<TaskType>) => {
        if (!data.draft) return
        data.draft = { ...data.draft, ...value }
      },
      updateTasks: (tasks: TaskType[]) => (data.tasks = tasks)
    })
  }
]

const css: FiCsRouter.Css<Data> = {
  ':host': {
    ...flexCenter('x'),
    position: 'absolute',
    containerType: 'inline-size',
    gap: size(8),
    width: '100%',
    paddingBlock: size(8),
    [`@container (width >= ${breakpoints.LG})`]: {
      '.tasks + .task-details': {
        paddingInlineStart: size(8),
        boxShadow: `${size(-2)} 0px ${size(2)} ${size(-2)} ${oklch(cssVar('black'), { darker: 0.3 })}`
      }
    },
    [`@media (max-width: ${breakpoints.SM})`]: { paddingBlock: size(4) }
  }
}

const hooks: FiCsRouter.Hooks<Data> = {
  created: ({ data }) => $lang.subscribe('page', (lang: Lang) => (data.lang = lang)),
  mounted: async ({ data }) => (data.tasks = await getAllTasks()),
  updated: {
    pathname: async ({ data }) => {
      const _pathname = data.pathname.replace(/^\//, '')
      if (_pathname === '') {
        data.isNotFound = false
        return
      }

      const id = parseInt(_pathname)
      if (!Number.isInteger(id)) {
        data.isNotFound = true
        return
      }

      const task: TaskType | undefined = getTask(await getAllTasks(), id)
      if (!task) {
        data.isNotFound = true
        return
      }

      data.isNotFound = false
      data.draft = task
    },
    queries: async ({ data }) => {
      const { taskId } = data.queries
      if (!taskId) {
        data.isNotFound = false
        return
      }

      const id = parseInt(taskId)
      if (!Number.isInteger(id)) {
        data.isNotFound = true
        return
      }

      data.queries = { ...data.queries, taskId: id.toString() }

      const task: TaskType | undefined = getTask(await getAllTasks(), id)
      if (!task) {
        data.isNotFound = true
        return
      }

      data.isNotFound = false
      data.draft = task
    },
    tasks: ({ data }) => {
      const { tasks, draft } = data
      if (!draft) return

      const { id: taskId, updatedAt } = draft,
        updatedDraft = tasks.find(({ id }) => id === taskId)

      if (updatedDraft && updatedDraft.updatedAt !== updatedAt) data.draft = updatedDraft
    }
  },
  destroyed: () => $lang.unsubscribe('page')
}

const spa: FiCsRouter.Spa<Data> = {
  children: [Tasks, TaskDetail, NotFound],
  data: () => ({ lang: $lang.get(), tasks: [], draft: undefined }),
  props,
  css,
  hooks
}

export default spa
