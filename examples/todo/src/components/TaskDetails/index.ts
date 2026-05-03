import { fics } from 'ficsjs'
import { dynamicPaths, goto } from 'ficsjs/router'
import { cssVar, flexCenter, size } from 'ficsjs/style'
import Loading from '@/components/materials/Loading'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import Textarea from '@/components/TaskDetails/Textarea'
import Button from '@/components/materials/Button'
import { deleteTask, getAllTasks, getTask, updateTask } from '@/stores'
import type { Lang, Task } from '@/types'
import convertTimestamp from '@/utils/convertTimestamp'
import { breakpoints, getTimestamp, white } from '@/utils/others'
import { Circle, CircleCheckBig } from 'lucide-static'

type Datetime = 'createdAt' | 'updatedAt'

interface Data {
  heading: string
  status: string
  texts: string[]
  labels: string[]
  isError: (task: Task) => boolean
  error: string
  descriptions: string[]
  placeholders: string[]
  datetimes: Record<Datetime, string>
  buttonText: string
  confirmation: string
}

interface Props {
  lang: Lang
  draft: Task
  editTask: (newValue: Partial<Task>) => void
  updateTasks: (tasks: Task[]) => void
}

const { sm } = breakpoints

export default fics<Data, Props>({
  name: 'task-details',
  children: [Loading(), Icon(), Input(), Textarea, Button()],
  data: () => ({
    labels: [],
    descriptions: [],
    isError: (task: Task) => task?.title === '',
    placeholders: [],
    texts: [],
    datetimes: {} as Record<Datetime, string>
  }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'task' })),
    confirmation: await i18n({ lang, key: ['tasks', 'confirmation'] })
  }),
  props: [
    {
      descendant: ({ children: { icon } }) => icon,
      values: ({ props: { draft, editTask } }) => ({
        click: () => {
          if ('completedAt' in draft)
            editTask({ completedAt: draft?.completedAt ? undefined : getTimestamp() })
        }
      })
    },
    {
      descendant: ({ children: { input } }) => input,
      values: ({
        data: { labels, isError, error, descriptions, placeholders },
        props: { draft, editTask }
      }) => ({
        id: 'title',
        label: labels[0],
        isError: isError(draft),
        error,
        description: descriptions[0],
        placeholder: placeholders[0],
        value: draft?.title,
        input: (title: string) => editTask({ title })
      })
    },
    {
      descendant: ({ children: { textarea } }) => textarea,
      values: ({ data: { labels, descriptions, placeholders }, props: { draft, editTask } }) => ({
        id: 'description',
        label: labels[1],
        description: descriptions[1],
        placeholder: placeholders[1],
        value: draft?.description,
        input: (description: string) => editTask({ description })
      })
    }
  ],
  className: 'task-details',
  html: ({
    children: { loading, icon, input, textarea, button },
    data: {
      heading,
      status,
      texts: [complete, revert, _delete, back, close],
      datetimes,
      buttonText,
      confirmation
    },
    props: { draft, editTask, updateTasks },
    template,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loading}`

    const label = draft?.completedAt ? revert : complete

    return template`
      <h2>${heading}</h2>
      <div class="container">
        <fieldset>
          <legend>${status}</legend>
          <div>
            ${icon.setIndividualProps('icon', {
              svg: draft?.completedAt ? CircleCheckBig : Circle,
              ariaLabel: label,
              isPressed: !!draft?.completedAt
            })}
            ${button.setIndividualProps('status', {
              type: 'label',
              buttonText: label,
              isPressed: !!draft?.completedAt,
              click: () =>
                editTask({ completedAt: draft?.completedAt ? undefined : getTimestamp() })
            })}
          </div>
        </fieldset>
        <fieldset>${input}</fieldset>
        <fieldset>${textarea}</fieldset>
        ${Object.entries(datetimes).map(
          ([key, value]) => template`<p>${value}${convertTimestamp(draft?.[key as Datetime])}</p>`
        )}
        <div>
          ${button.setIndividualProps('save', {
            isDisabled: draft?.title === '',
            type: 'gradation',
            fixedUnit: 32,
            buttonText,
            click: async () => {
              const { id, title, description, completedAt }: Task = draft
              const tasks: Task[] = await updateTask({ id, title, description, completedAt })

              const task: Task | undefined = getTask(tasks, id)
              if (!task) return

              editTask(task)
              updateTasks(tasks)
              goto('/')
            }
          })}
          ${[_delete, !Number.isInteger(parseInt(dynamicPaths().taskId)) ? close : back].map(
            (buttonText, index) =>
              template`${button.setIndividualProps(index, {
                type: index === 0 ? 'delete' : 'normal',
                fixedUnit: 32,
                buttonText,
                click: async () => {
                  if (index === 0) {
                    if (window.confirm(confirmation)) {
                      await deleteTask(draft?.id)
                      updateTasks(await getAllTasks())
                      goto('/')
                    }
                  } else goto('/')
                }
              })}`
          )}
        </div>
      </div>
    `
  },
  css: {
    'div.container': {
      width: sm,
      maxWidth: size(120 - 16),
      marginInline: 'auto',
      [`@media (max-width: ${sm})`]: { width: '100%' },
      fieldset: {
        display: 'flex',
        flexDirection: 'column',
        marginBlockEnd: size(4),
        border: 0,
        legend: { paddingBlockEnd: size(2) },
        button: { paddingInline: size(4), '&:hover': { background: white(0.1) } },
        div: { ...flexCenter('y'), button: { paddingInline: cssVar('outline') } }
      },
      p: {
        marginBlockEnd: size(2),
        textAlign: 'left',
        '&:last-of-type': { marginBlockEnd: size(8) }
      },
      '> div': { display: 'flex', flexDirection: 'column', gap: size(2) }
    }
  },
  options: { lazyLoad: true }
})
