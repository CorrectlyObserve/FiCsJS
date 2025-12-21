import { fics } from 'ficsjs'
import { dynamicPaths, goto } from 'ficsjs/router'
import { calc, cssVar, flexCenter } from 'ficsjs/style'
import LoadingIcon from '@/components/LoadingIcon'
import Icon from '@/components/materials/Icon'
import Input from '@/components/materials/Input'
import Textarea from '@/components/TaskDetails/Textarea'
import Button from '@/components/materials/Button'
import { deleteTask, getAllTasks, getTask, updateTask } from '@/stores'
import type { Lang, Task } from '@/types'
import convertTimestamp from '@/utils/convertTimestamp'
import { breakpoints, getTimestamp } from '@/utils/others'
import { Circle, CircleCheckBig } from 'lucide-static'

type Datetime = 'createdAt' | 'updatedAt'

interface Data {
  heading: string
  title: string
  isError: (task: Task) => boolean
  error: string
  placeholders: string[]
  description: string
  buttonText: string
  status: string
  texts: string[]
  datetimes: Record<Datetime, string>
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
  children: [LoadingIcon, Icon(), Input(), Textarea, Button()],
  data: () => ({
    title: '',
    isError: (task: Task) => task?.title === '',
    error: '',
    placeholders: [],
    description: '',
    buttonText: '',
    texts: [],
    datetimes: {} as Record<Datetime, string>
  }),
  i18nData: async ({ props: { lang }, i18n }) => ({
    ...(await i18n<Data>({ lang, key: 'task' })),
    confirmation: await i18n({ lang, key: ['tasks', 'confirmation'] })
  }),
  props: [
    {
      descendant: ({ children: { loadingIcon } }) => loadingIcon,
      values: ({ props: { lang } }) => ({ lang })
    },
    {
      descendant: ({ children: { icon } }) => icon,
      values: ({ props: { draft, editTask } }) => ({
        click: () => {
          if ('completedAt' in draft)
            editTask({ completedAt: draft.completedAt ? undefined : getTimestamp() })
        }
      })
    },
    {
      descendant: ({ children: { input } }) => input,
      values: ({ data: { title, error, placeholders }, props: { editTask } }) => ({
        id: 'title',
        label: title,
        error: error,
        placeholder: placeholders[0],
        input: (title: string) => editTask({ title })
      })
    },
    {
      descendant: ({ children: { textarea } }) => textarea,
      values: ({ data: { description, placeholders }, props: { editTask } }) => ({
        id: 'description',
        label: description,
        placeholder: placeholders[1],
        input: (description: string) => editTask({ description })
      })
    },
    {
      descendant: ({ children: { button } }) => button,
      values: ({ data: { buttonText }, props: { draft, editTask, updateTasks } }) => ({
        buttonText,
        click: async () => {
          const { id, title, description, completedAt }: Task = draft
          await updateTask({ id, title, description, completedAt })

          const task: Task | undefined = getTask(await getAllTasks(), id)
          if (!task) return

          editTask(task)
          updateTasks(await getAllTasks())
          goto('/')
        }
      })
    }
  ],
  className: 'task-details',
  html: ({
    children: { loadingIcon, icon, input, textarea, button },
    data: {
      heading,
      status,
      texts: [complete, revert, _delete, back, close],
      datetimes
    },
    props: { draft },
    template,
    isDeferred
  }) => {
    if (!isDeferred) return template`${loadingIcon}`

    const label = draft?.completedAt ? revert : complete

    return template`
      <h2>${heading}</h2>
      <div class="container">
        <fieldset>
          <label>${status}</label>
          <div>
            ${icon.setIndividualProps('icon', {
              svg: draft?.completedAt ? CircleCheckBig : Circle,
              areaLabel: label
            })}
            <span role="button" tabindex="0">${label}</span>
          </div>
        </fieldset>
        <fieldset>${input}</fieldset>
        <fieldset>${textarea}</fieldset>
        ${Object.entries(datetimes).map(
          ([key, value]) => template`<p>${value}${convertTimestamp(draft?.[key as Datetime])}</p>`
        )}
        ${button}
        <div>
          ${[_delete, !Number.isFinite(parseInt(dynamicPaths().taskId)) ? close : back].map(
            text => template`<span role="button" tabindex="0">${text}</span>`
          )}
        </div>
      </div>
    `
  },
  css: {
    'div.container': {
      width: sm,
      maxWidth: calc('-', calc(`${cssVar('md')} * 30`), `${cssVar('xl')} * 2`),
      marginInline: 'auto',
      [`@media (max-width: ${sm})`]: { width: '100%' },
      fieldset: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: cssVar('md'),
        border: 0,
        label: { paddingBottom: cssVar('xs') },
        div: { display: 'flex', span: { ...flexCenter('y'), paddingLeft: 0, lineHeight: 1 } }
      },
      p: {
        marginBottom: cssVar('xs'),
        textAlign: 'left',
        '&:last-of-type': { marginBottom: cssVar('xl') }
      },
      '> div': {
        display: 'flex',
        flexDirection: 'column',
        marginTop: cssVar('md'),
        span: {
          marginInline: 'auto',
          textDecoration: 'underline',
          '&:first-of-type': { color: cssVar('red'), '&:focus': { opacity: 0.2 } },
          [`@media (max-width: ${sm})`]: { paddingBlock: cssVar('md') }
        }
      }
    }
  },
  actions: {
    'fieldset label, fieldset span': {
      click: [
        ({
          props: {
            draft: { completedAt },
            editTask
          }
        }) => editTask({ completedAt: completedAt ? undefined : getTimestamp() }),
        { throttle: 500, blur: true }
      ]
    },
    'div.container > div span:first-of-type': {
      click: [
        async ({
          data: { confirmation },
          props: {
            draft: { id },
            updateTasks
          }
        }) => {
          if (window.confirm(confirmation)) {
            await deleteTask(id)
            updateTasks(await getAllTasks())
            goto('/')
          }
        },
        { throttle: 500, blur: true }
      ]
    },
    'div.container > div span:last-of-type': {
      click: [() => goto('/'), { throttle: 500, blur: true }]
    }
  },
  options: { lazyLoad: true }
})
