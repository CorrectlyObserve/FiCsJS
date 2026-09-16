import { fics, type FiCs } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { cssVar, flexCenter, size } from 'ficsjs/style'
import Loading from '@/components/Loading'
import Icon from '@/components/Icon'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Draggable, { type Moved } from '@/components/Draggable'
import type { ReorderLabels } from '@/components/DragMenu'
import TaskRow from '@/components/TaskRow'
import {
  addTask,
  completeTask,
  deleteTask,
  duplicateTask,
  reorderTasks,
  revertTask
} from '@/stores'
import type { Task } from '@/types'
import type { Lang } from '@/utils/lang'
import { breakpoints, columnWidth, measureOffsetWidth } from '@/utils/style'
import { Plus, Square, SquareCheck } from 'lucide-static'

interface Data {
  heading: string
  description: string
  value: string
  placeholder: string
  isShown: boolean
  show: string
  hide: string
  texts: string[]
  completed: string
  uncompleted: string
  confirmation: string
  unapplicable: string
  reorder: ReorderLabels
}

interface Props {
  lang: Lang
  tasks: Task[]
  taskId: number
  setTasks: (tasks: Task[]) => void
}

/** @remarks Completed tasks can be hidden, so this is the list the page both shows and reorders. */
const getShownTasks = (tasks: Task[], isShown: boolean): Task[] =>
  isShown ? tasks : tasks.filter(({ completedAt }) => !completedAt)

const props: FiCs.Props<Data, Props> = [
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
    descendants: ({ children: { button } }) => button,
    values: ({ data }) => ({
      type: 'label',
      isPressed: data.isShown,
      buttonText: data.isShown ? data.hide : data.show,
      click: () => (data.isShown = !data.isShown)
    })
  },
  {
    descendants: ({ children: { draggable } }) => draggable,
    values: ({ data, children: { taskRow }, props: { tasks, taskId, setTasks } }) => {
      const {
        texts: [complete, revert, remove],
        completed,
        uncompleted,
        confirmation,
        reorder,
        isShown
      } = data
      const isQuery = measureOffsetWidth()

      return {
        array: getShownTasks(tasks, isShown),
        labels: reorder,
        slot: (task: Task, index: number) =>
          taskRow.setIndividualProps(index, {
            task,
            texts: { complete, revert, remove },
            statuses: { completed, uncompleted },
            isQuery,
            toggle: async () =>
              setTasks(await (task.completedAt ? revertTask(task.id) : completeTask(task.id))),
            remove: async () => {
              if (!window.confirm(confirmation)) return

              setTasks(await deleteTask(task.id))
              if (taskId === task.id) goto('/')
            }
          }),
        onMove: async ({ item, after }: Moved<Task>) =>
          setTasks(await reorderTasks(item.id, after?.id)),
        onCopy: async ({ item, after }: Moved<Task>) =>
          setTasks(await duplicateTask(item.id, after?.id))
      }
    }
  }
]

const html: FiCs.Html<Data, Props> = ({
  children: { loading, icon, input, button, draggable },
  data,
  props: { tasks, setTasks },
  template,
  isDeferred
}) => {
  if (!isDeferred) return template`${loading}`

  const { heading, value, placeholder, isShown, show, hide, unapplicable } = data

  return template`
    <h2>${heading}</h2>
    <div key="menu">
      <div>
        ${input}
        ${icon.setIndividualProps('add', {
          svg: Plus,
          ariaLabel: placeholder,
          click: async () => {
            if (value !== '') {
              setTasks(await addTask(value))
              data.value = ''
            }
          }
        })}
      </div>
      <div>
        ${icon.setIndividualProps('check', {
          svg: isShown ? SquareCheck : Square,
          ariaLabel: isShown ? hide : show,
          isPressed: isShown,
          click: () => (data.isShown = !data.isShown)
        })}
        ${button}
      </div>
    </div>
    ${
      getShownTasks(tasks, isShown).length > 0
        ? template`${draggable}`
        : template`<p>${unapplicable}</p>`
    }
  `
}

const css: FiCs.Css<Data, Props> = `
  :host {
    width: ${columnWidth};
    max-width: calc(100cqi - ${size(8)});

    div[key="menu"] {
      margin-block-end: ${size(8)};

      div {
        ${flexCenter('xy')}
        max-width: 100%;
        margin-block-end: ${size(4)};

        &:last-child { margin-block-end: 0; }
        .input { flex: 1; min-width: 0; margin-inline-end: ${cssVar('outline')}; }
        span { padding-inline: ${cssVar('outline')}; }
      }

      @media (max-width: ${breakpoints.SM}) {
        margin-block-end: ${size(4)};

        div {
          margin-block-end: ${size(2)};
          &:first-child { margin-inline-end: ${size(-4)}; }
        }
      }
    }
  }
`

export default fics<Data, Props>({
  name: 'tasks',
  children: [Loading(), Icon(), Input(), Button(), Draggable<Task>(), TaskRow()],
  /** @remarks The props below run before i18n resolves, so the texts they read start out empty. */
  data: () => ({
    value: '',
    placeholder: '',
    isShown: false,
    tasks: [],
    texts: [],
    reorder: { handle: '', up: '', down: '', copy: '', moved: '', duplicated: '' }
  }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'tasks' })),
    texts: ((await i18n({ lang, key: ['task', 'texts'] })) as string[]).slice(0, 3)
  }),
  props,
  className: 'tasks',
  html,
  css,
  options: { lazyLoad: true }
})
