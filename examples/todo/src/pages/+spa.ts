import type { FiCsRouter } from 'ficsjs/router'
import { cssVar, flexCenter, oklch, size } from 'ficsjs/style'
import { $lang, type Lang } from '@/domain/lang'
import { parseTaskPath, type TaskPath } from '@/domain/path'
import TaskList from '@/pages/_task/List'
import TaskDetail from '@/pages/_task/Details'
import NotFound from '@/pages/NotFound'
import { getAllTasks, getTask, type Task as TaskType } from '@/domain/task'
import { breakpoints } from '@/styles/theme'

export interface Data {
  lang: Lang
  tasks: TaskType[]
  draft?: TaskType
}

const toTaskId = ({
  pathname,
  queries
}: Pick<FiCsRouter.DefaultData, 'pathname' | 'queries'>): number | null => {
  const segment: string = pathname.replace(/^\//, ''),
    raw: string = segment === '' ? (queries.taskId ?? '') : segment

  if (raw === '') return null
  return /^\d+$/.test(raw) ? Number(raw) : NaN
}
const syncDraft = async (
  data: FiCsRouter.DefaultData & { draft?: Readonly<TaskType> }
): Promise<void> => {
  const path: TaskPath | null = parseTaskPath({ pathname: data.pathname, queries: data.queries })

  if (path === null) {
    data.status = 200
    data.draft = undefined
    return
  }

  const task: TaskType | undefined = getTask(await getAllTasks(), path.id)
  data.status = task === undefined ? 404 : 200
  data.draft = task
}

const props: FiCsRouter.Props<Data> = [
  {
    descendants: ({ children: { taskList, taskDetails, notFound } }) => [
      taskList,
      taskDetails,
      notFound
    ],
    values: ({ data: { lang } }) => ({ lang })
  },
  {
    descendants: ({ children: { tasks } }) => tasks,
    values: ({ data }) => ({
      tasks: data.tasks,
      taskId: parseTaskPath({ pathname: data.pathname, queries: data.queries })?.id ?? NaN,
      setTasks: (tasks: TaskType[]) => (data.tasks = tasks)
    })
  },
  {
    descendants: ({ children: { taskDetails } }) => taskDetails,
    values: ({ data }) => ({
      draft: data.draft,
      isQueryParam:
        parseTaskPath({ pathname: data.pathname, queries: data.queries })?.isQueryParam ?? false,
      editTask: (value: Partial<TaskType>) => {
        if (!data.draft) return
        data.draft = { ...data.draft, ...value }
      },
      updateTasks: (tasks: TaskType[]) => (data.tasks = tasks)
    })
  }
]

const css: FiCsRouter.Css<Data> = `
  main {
    ${flexCenter('x')}
    flex-grow: 1;
    container-type: inline-size;
    gap: ${size(8)};
    width: 100%;
    padding-block: ${size(8)};

    @container (width >= ${breakpoints.LG}) {
      .task-list + .task-details {
        padding-inline-start: ${size(8)};
        box-shadow: ${size(-2)} 0px ${size(2)} ${size(-2)} ${oklch(cssVar('black'), { darker: 0.3 })};
      }
    }

    @media (max-width: ${breakpoints.SM}) { padding-block: ${size(4)}; }
  }
`

const hooks: FiCsRouter.Hooks<Data> = {
  created: ({ data }) => $lang.subscribe('page', (lang: Lang) => (data.lang = lang)),
  mounted: async ({ data }) => (data.tasks = await getAllTasks()),
  updated: {
    pathname: ({ data }) => void syncDraft(data),
    queries: ({ data }) => void syncDraft(data),
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
  children: [TaskList, TaskDetail, NotFound],
  data: () => ({ lang: $lang.get(), tasks: [], draft: undefined }),
  props,
  css,
  hooks
}

export default spa
