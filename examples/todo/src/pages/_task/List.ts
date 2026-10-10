import { fics, type FiCs } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { flexCenter, size } from 'ficsjs/style'
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
import type { Placement, ReorderLabels } from '@/pages/_task/drag'
import Draggable from '@/pages/_task/Draggable'
import TaskRow from '@/pages/_task/Row'
import { columnWidth, measureOffsetWidth } from '@/styles/theme'
import { Plus, Square, SquareCheck } from 'lucide-static'

interface Data {
  heading: string
  value: string
  placeholder: string
  description: string
  isShown: boolean
  check: string
  texts: string[]
  reorder: ReorderLabels
  completed: string
  uncompleted: string
  confirmation: string
  unapplicable: string
  getTasks: (tasks: Task[], isOnlyIncomplete: boolean) => Task[]
}

interface Props {
  lang: Lang
  tasks: Task[]
  taskId: number
  setTasks: (tasks: Task[]) => void
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
        enterKey: async () => {
          if (value !== '') {
            setTasks(await addTask(value))
            data.value = ''
          }
        }
      }
    }
  },
  {
    descendants: ({ children: { icon } }) => icon,
    values: ({ data, props: { setTasks } }) => ({
      svg: Plus,
      ariaLabel: data.placeholder,
      click: async () => {
        if (data.value !== '') {
          setTasks(await addTask(data.value))
          data.value = ''
        }
      }
    })
  },
  {
    descendants: ({ children: { button } }) => button,
    values: ({ data }) => ({
      type: 'label',
      isPressed: data.isShown,
      svg: data.isShown ? SquareCheck : Square,
      buttonText: data.check,
      click: () => (data.isShown = !data.isShown)
    })
  },
  {
    descendants: ({ children: { draggable } }) => draggable,
    values: ({ data, children: { row }, props: { tasks, taskId, setTasks } }) => {
      const {
        getTasks,
        isShown,
        texts: [complete, revert, remove],
        reorder,
        completed,
        uncompleted,
        confirmation
      } = data

      return {
        tasks: getTasks(tasks, !isShown),
        labels: reorder,
        slot: (task: Task, index: number) =>
          row.setIndividualProps(index, {
            task,
            texts: { complete, revert, remove },
            statuses: { completed, uncompleted },
            isQueryParam: measureOffsetWidth(),
            switchStatus: async () =>
              setTasks(await (task.completedAt ? revertTask(task.id) : completeTask(task.id))),
            remove: async () => {
              if (!window.confirm(confirmation)) return

              setTasks(await deleteTask(task.id))
              if (taskId === task.id) goto('/')
            }
          }),
        onMove: async ({ task, after }: Placement) =>
          setTasks(await reorderTasks(task.id, after?.id)),
        onCopy: async ({ task, after }: Placement) => setTasks(await cloneTask(task.id, after?.id))
      }
    }
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
    max-width: calc(100cqi - ${size(8)});

    > div {
      ${flexCenter('y', { direction: 'column' })}
      gap: ${size(4)};
      margin-block-end: ${size(2)};

      > div {
        ${flexCenter('y')}
        gap: ${size(1)};
        width: 100%;

        .input { flex: 1; min-width: 0; }
      }
    }

    > p { margin-block-start: ${size(2)}; }
  }
`

export default fics<Data, Props>({
  name: 'task-list',
  children: [LoadState(), Icon(), Input(), Button(), Draggable(), TaskRow],
  data: () => ({
    value: '',
    placeholder: '',
    isShown: false,
    tasks: [],
    texts: [],
    reorder: {} as ReorderLabels,
    getTasks: (tasks: Task[], isOnlyIncomplete: boolean) =>
      isOnlyIncomplete ? getIncompleteTasks(tasks) : tasks
  }),
  deferredData: {
    load: async ({ props: { lang }, i18n }) => ({
      ...(await i18n({ lang, key: 'tasks' })),
      texts: ((await i18n({ lang, key: ['task', 'texts'] })) as string[]).slice(0, 3)
    }),
    stateKey: 'texts',
    propsKey: 'lang',
    allowStale: true
  },
  props,
  className: 'task-list',
  html,
  css,
  options: { lazyLoad: true }
})
