import { fics, type FiCs } from 'ficsjs'
import { applyMeta, goto } from 'ficsjs/router'
import { flex, space } from 'ficsjs/style'
import LoadState from '@/components/LoadState'
import Icon from '@/components/Icon'
import Input from '@/components/Input'
import Button from '@/components/Button'
import type { Lang } from '@/domain/lang'
import {
  addTask,
  completeTask,
  deleteTask,
  cloneTask,
  getIncompleteTasks,
  reorderTasks,
  revertTask,
  type Task
} from '@/domain/task'
import type { Insertion, ReorderLabels } from '@/pages/_task/drag'
import Draggable from '@/pages/_task/Draggable'
import TaskRow from '@/pages/_task/Row'
import { columnWidth, isExpanded } from '@/styles/theme'
import { Plus, Square, SquareCheck } from 'lucide-static'

interface Data {
  readonly heading: string
  readonly pageTitle: FiCs.Interpolate
  value: string
  readonly placeholder: string
  readonly description: string
  isShown: boolean
  readonly check: string
  readonly texts: Readonly<Record<string, string>>
  readonly copiedTitle: FiCs.Interpolate
  readonly reorder: ReorderLabels
  readonly completed: string
  readonly uncompleted: string
  readonly confirmation: string
  readonly unapplicable: string
  readonly getTasks: (tasks: readonly Task[], isOnlyIncomplete: boolean) => readonly Task[]
}

interface Props {
  lang: Lang
  tasks: readonly Task[]
  taskId: number
  setTasks: (tasks: readonly Task[]) => void
}

const submitTask = async (data: Data, setTasks: Props['setTasks']) => {
  const title: string = data.value
  if (title === '') return

  data.value = ''
  setTasks(await addTask(title))
}

const props: FiCs.Props<Data, Props> = [
  {
    descendants: ({ children: { loadState } }) => loadState,
    values: ({ deferredStates, reloadDeferredData }) => ({
      isError: deferredStates.texts.status === 'error',
      retry: () => reloadDeferredData()
    })
  },
  {
    descendants: ({ children: { input } }) => input,
    values: ({ data, props: { setTasks } }) => {
      const { value, description, placeholder } = data

      return {
        id: 'new-task',
        label: placeholder,
        isAriaLabel: true,
        value,
        description,
        placeholder,
        input: (value: string) => (data.value = value),
        enterKey: () => submitTask(data, setTasks)
      }
    }
  },
  {
    descendants: ({ children: { icon } }) => icon,
    values: ({ data, props: { setTasks } }) => ({
      svg: Plus,
      ariaLabel: data.placeholder,
      click: () => submitTask(data, setTasks)
    })
  },
  {
    descendants: ({ children: { button } }) => button,
    values: ({ data }) => ({
      state: data.isShown ? 'pressed' : undefined,
      svg: data.isShown ? SquareCheck : Square,
      buttonText: data.check,
      click: () => (data.isShown = !data.isShown)
    })
  },
  {
    descendants: ({ children: { draggable } }) => draggable,
    values: ({
      data: {
        getTasks,
        isShown,
        texts,
        copiedTitle,
        reorder,
        completed,
        uncompleted,
        confirmation
      },
      children: { row },
      props: { tasks, taskId, setTasks }
    }) => ({
      tasks: getTasks(tasks, !isShown),
      labels: reorder,
      slot: (task: Task, index: number) =>
        row.setIndividualProps(index, {
          task,
          texts,
          statuses: { completed, uncompleted },
          isQueryParam: isExpanded(),
          switchStatus: async () =>
            setTasks(await (task.completedAt ? revertTask(task.id) : completeTask(task.id))),
          remove: async () => {
            if (!window.confirm(confirmation)) return

            setTasks(await deleteTask(task.id))
            if (taskId === task.id) goto('/')
          }
        }),
      onMove: async ({ taskId, targetId }: Insertion) =>
        setTasks(await reorderTasks(taskId, targetId)),
      onCopy: async ({ taskId, targetId }: Insertion) =>
        setTasks(await cloneTask({ id: taskId, targetId, copiedTitle }))
    })
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { loadState, icon, input, button, draggable },
  data: { heading, isShown, unapplicable, getTasks },
  props: { tasks },
  template,
  deferredStates: {
    texts: { status }
  }
}) => {
  if (status !== 'done') return template`${loadState}`

  return template`
    <h2>${heading}</h2>
    <div>
      <div>${input}${icon}</div>
      ${button}
    </div>
    ${
      getTasks(tasks, !isShown).length > 0
        ? template`${draggable}`
        : template`<p>${unapplicable}</p>`
    }
  `
}

const css: FiCs.Css<Data, Props> = `
  :host {
    width: ${columnWidth};
    max-width: calc(100cqi - ${space('lg')});

    > div {
      ${flex({ center: 'y', direction: 'column', gap: space('md') })}
      margin-block-end: ${space('sm')};

      > div {
        ${flex({ center: 'y', gap: space('xs') })}
        width: 100%;

        .input { width: 100%; }
      }
    }

    > p { margin-block-start: ${space('sm')}; }
  }
`

const hooks: FiCs.Hooks<Data, Props> = {
  rerendered: ({ data: { heading, pageTitle }, props: { taskId }, changedKeys }) => {
    const isChanged = changedKeys.data.includes('pageTitle') || changedKeys.props.includes('taskId')

    if (isChanged && Number.isNaN(taskId))
      applyMeta({ title: pageTitle({ page: heading }) }, { merge: true })
  }
}

export default fics<Data, Props>({
  name: 'task-list',
  children: [LoadState(), Icon(), Input(), Button(), Draggable, TaskRow],
  data: () => ({
    value: '',
    placeholder: '',
    isShown: false,
    tasks: [],
    texts: {},
    reorder: {} as ReorderLabels,
    getTasks: (tasks: readonly Task[], isOnlyIncomplete: boolean) =>
      isOnlyIncomplete ? getIncompleteTasks(tasks) : tasks
  }),
  deferredData: {
    load: async ({ props: { lang }, i18n }) => ({
      ...(await i18n({ lang, key: 'tasks' })),
      pageTitle: await i18n({ lang, key: ['head', 'title'], interpolate: true }),
      texts: await i18n({ lang, key: ['task', 'texts'] }),
      copiedTitle: await i18n({ lang, key: ['tasks', 'copiedTitle'], interpolate: true })
    }),
    stateKey: 'texts',
    propsKey: 'lang',
    allowStale: true
  },
  props,
  className: 'task-list',
  html,
  css,
  hooks,
  options: { lazyLoad: true }
})
