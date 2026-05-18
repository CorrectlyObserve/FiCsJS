import { fics } from 'ficsjs'
import { goto } from 'ficsjs/router'
import { calc, cssVar, flexCenter, size } from 'ficsjs/style'
import Loading from '@/components/materials/Loading'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import Button from '@/components/materials/Button'
import Link from '@/components/Tasks/Link'
import { addTask, completeTask, deleteTask, revertTask } from '@/stores'
import type { Lang, Task } from '@/types'
import { breakpoints, measureOffsetWidth } from '@/utils/others'
import { Circle, CircleCheckBig, Plus, Square, SquareCheck, Trash2 } from 'lucide-static'

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
}

interface Props {
  lang: Lang
  tasks: Task[]
  taskId: number
  setTasks: (tasks: Task[]) => void
}

const { SM } = breakpoints

export default fics<Data, Props>({
  name: 'tasks',
  children: [Loading(), Icon(), Input(), Button(), Link],
  data: () => ({ value: '', placeholder: '', isShown: false, tasks: [] }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'tasks' })),
    texts: ((await i18n({ lang, key: ['task', 'texts'] })) as string[]).slice(0, 3)
  }),
  props: [
    {
      descendant: ({ children: { input } }) => input,
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
      descendant: ({ children: { button } }) => button,
      values: ({ data }) => ({
        type: 'label',
        isPressed: data.isShown,
        buttonText: data.isShown ? data.hide : data.show,
        click: () => (data.isShown = !data.isShown)
      })
    }
  ],
  className: 'tasks',
  html: ({
    children: { loading, icon, input, button, link },
    data,
    props: { tasks, taskId, setTasks },
    template,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loading}`

    const {
      heading,
      value,
      placeholder,
      isShown,
      show,
      hide,
      texts: [complete, revert, _delete],
      completed,
      uncompleted,
      confirmation,
      unapplicable
    } = data

    if (!isShown) tasks = tasks.filter(({ completedAt }) => !completedAt)

    const isQuery = measureOffsetWidth()
    return template`
      <h2>${heading}</h2>
      <div class="menu">
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
        tasks.length > 0
          ? tasks.map(
              ({ id, title, completedAt }, index) => template`
                <div class="task" key="${index}">
                  <div>
                    ${icon.setIndividualProps(`${id}-${completedAt ? 'check' : 'circle'}`, {
                      svg: completedAt ? CircleCheckBig : Circle,
                      ariaLabel: completedAt ? revert : complete,
                      click: async () =>
                        setTasks(await (completedAt ? revertTask(id) : completeTask(id)))
                    })}
                    ${link.setIndividualProps(id, {
                      id,
                      title,
                      completedAt,
                      status: completedAt ? completed : uncompleted,
                      isQuery
                    })}
                  </div>
                  ${icon.setIndividualProps(`${id}-delete`, {
                    svg: Trash2,
                    ariaLabel: _delete,
                    color: cssVar('red'),
                    click: async () => {
                      if (window.confirm(confirmation)) {
                        setTasks(await deleteTask(id))
                        if (taskId === id) goto('/')
                      }
                    }
                  })}
                </div>
              `
            )
          : template`<p>${unapplicable}</p>`
      }
    `
  },
  css: {
    div: {
      '&.menu': {
        marginBlockEnd: size(8),
        div: {
          ...flexCenter('xy'),
          marginBlockEnd: size(4),
          '&:last-child': { marginBlockEnd: 0 },
          '.input': { marginInlineEnd: cssVar('outline') },
          span: { paddingInline: cssVar('outline') }
        },
        [`@media (max-width: ${sm})`]: {
          marginBlockEnd: size(4),
          div: { marginBlockEnd: size(2) }
        }
      },
      '&.task': {
        ...flexCenter('y'),
        width: SM,
        maxWidth: size(120 - 16),
        marginInline: 'auto',
        marginBlockEnd: size(2),
        '&:last-child': { marginBlockEnd: 0 },
        [`@media (max-width: ${SM})`]: { width: calc(`100% - ${size(12)}`) },
        div: { ...flexCenter('y'), width: calc(`100% - ${size(12)}`) }
      }
    }
  },
  options: { lazyLoad: true }
})
