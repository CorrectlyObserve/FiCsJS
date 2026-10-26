import type { FiCsRouter } from 'ficsjs/router'
import { calc, color, flex, layout, size, space } from 'ficsjs/style'
import { $lang, type Lang } from '@/domain/lang'
import { parseTaskPath, type TaskPath } from '@/domain/path'
import TaskList from '@/pages/_task/List'
import TaskDetail from '@/pages/_task/Details'
import NotFound from '@/pages/NotFound'
import { getAllTasks, getTask, type Task as TaskType } from '@/domain/task'

export interface Data {
  lang: Lang
  tasks: readonly TaskType[]
  draft?: TaskType
}

const texts: Record<Lang, { loading: string; error: string; retry: string }> = {
  en: { loading: 'Loading...', error: 'The texts could not be loaded.', retry: 'Try again' },
  ja: { loading: '読み込み中', error: '文言を読み込めませんでした。', retry: '再読み込み' }
}
const syncDraft = async (
  data: FiCsRouter.DefaultData & { draft?: Readonly<TaskType> }
): Promise<void> => {
  const path: TaskPath | null = parseTaskPath({
    dynamicParams: data.dynamicParams,
    queries: data.queries
  })

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
    descendants: ({ children: { taskList, taskDetails, notFound } }) =>
      [taskList, taskDetails, notFound].map(child => child.getChildren().loadState),
    values: ({ data: { lang } }) => ({ texts: texts[lang] })
  },
  {
    descendants: ({ children: { taskList } }) => taskList,
    values: ({ data }) => ({
      tasks: data.tasks,
      taskId:
        parseTaskPath({ dynamicParams: data.dynamicParams, queries: data.queries })?.id ?? NaN,
      setTasks: (tasks: readonly TaskType[]) => (data.tasks = tasks)
    })
  },
  {
    descendants: ({ children: { taskDetails } }) => taskDetails,
    values: ({ data }) => ({
      draft: data.draft,
      isQueryParam:
        parseTaskPath({ dynamicParams: data.dynamicParams, queries: data.queries })?.isQueryParam ??
        false,
      editTask: (value: Partial<TaskType>) => {
        if (!data.draft) return
        data.draft = { ...data.draft, ...value }
      },
      updateTasks: (tasks: readonly TaskType[]) => (data.tasks = tasks)
    })
  }
]

const css: FiCsRouter.Css<Data> = `
  main {
    ${flex({ center: 'x', gap: space('lg') })}
    flex-grow: 1;
    container-type: inline-size;
    width: 100%;
    padding-block: ${space('lg')} ${calc(`${space('lg')} + ${space('md-')}`)};

    @container ${layout('expanded')} {
      .task-list + .task-details {
        padding-inline-start: ${space('lg')};
        box-shadow: ${size(-2)} 0px ${size(2)} ${size(-2)} ${color('shadow')};
      }
    }

    @container not ${layout('expanded')} { padding-block-start: ${space('md')}; }
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
